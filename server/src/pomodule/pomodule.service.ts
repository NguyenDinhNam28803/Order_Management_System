import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PoRepository } from './po.repository';
import { CreatePoDto } from './dto/create-po.dto';
import { ConsolidatePRsDto } from './dto/consolidate-prs.dto';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { PoStatus, PrStatus, DocumentType } from '@prisma/client';
import { ApprovalModuleService } from '../approval-module/approval-module.service';
import { SupplierKpimoduleService } from '../supplier-kpimodule/supplier-kpimodule.service';
import { BudgetModuleService } from '../budget-module/budget-module.service';
import { AutomationService } from '../common/automation/automation.service';
import { ContractModuleService } from '../contract-module/contract-module.service';

@Injectable()
export class PomoduleService {
  private readonly logger = new Logger(PomoduleService.name);

  constructor(
    private readonly repository: PoRepository,
    private readonly prisma: PrismaService,
    private readonly approvalService: ApprovalModuleService,
    private readonly supplierKpiService: SupplierKpimoduleService,
    private readonly budgetService: BudgetModuleService,
    private readonly automationService: AutomationService,
    private readonly contractService: ContractModuleService,
  ) {}

  async create(createPoDto: CreatePoDto, user: JwtPayload) {
    const { orgId, costCenterId, totalAmount } = createPoDto;

    // 1. Giữ chỗ ngân sách (Budget Reservation) sử dụng BudgetService tập trung
    if (costCenterId) {
      await this.budgetService.reserveBudget(
        costCenterId,
        orgId,
        Number(totalAmount),
        user,
      );
    }

    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    return this.repository.create(createPoDto, user.sub, orgId, poNumber);
  }

  async getAll() {
    return this.repository.getAll();
  }

  /**
   * Tạo PO từ một PR đã được duyệt hoàn toàn
   * @param prId ID của Purchase Requisition
   * @param supplierId ID của Nhà cung cấp được chọn
   * @param user Thông tin người thực hiện (Procurement/Buyer)
   */
  async createFromPr(prId: string, supplierId: string, user: JwtPayload) {
    // 1. Kiểm tra PR
    const pr = await this.prisma.purchaseRequisition.findUnique({
      where: { id: prId },
      include: { items: true },
    });

    if (!pr) throw new NotFoundException('Không tìm thấy yêu cầu mua sắm (PR)');
    if (pr.status !== 'APPROVED') {
      throw new BadRequestException(
        'Chỉ có thể tạo PO từ PR đã được duyệt hoàn toàn.',
      );
    }

    // 2. Chuẩn bị dữ liệu PO từ PR
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const po = await this.prisma.$transaction(async (tx) => {
      // A. Tạo PO
      const newPo = await tx.purchaseOrder.create({
        data: {
          poNumber,
          orgId: pr.orgId,
          prId: pr.id,
          supplierId: supplierId,
          buyerId: user.sub,
          deptId: pr.deptId,
          costCenterId: pr.costCenterId,
          status: PoStatus.DRAFT,
          totalAmount: pr.totalEstimate,
          currency: pr.currency,
          deliveryDate:
            pr.requiredDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // B. Copy các item từ PR sang PO
      for (const item of pr.items) {
        await tx.poItem.create({
          data: {
            poId: newPo.id,
            prItemId: item.id,
            lineNumber: item.lineNumber,
            sku: item.sku,
            description: item.productDesc,
            qty: item.qty,
            unit: item.unit,
            unitPrice: item.estimatedPrice,
            total: Number(item.qty) * Number(item.estimatedPrice),
          },
        });
      }

      // C. Cập nhật trạng thái PR
      await tx.purchaseRequisition.update({
        where: { id: pr.id },
        data: { status: 'PO_CREATED' as PrStatus },
      });

      return newPo;
    });

    return po;
  }

  async submit(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!po) throw new NotFoundException('PO not found');
    if (po.status !== PoStatus.DRAFT) {
      throw new BadRequestException('Only draft POs can be submitted');
    }

    await this.approvalService.initiateWorkflow({
      docType: DocumentType.PURCHASE_ORDER,
      docId: po.id,
      totalAmount: Number(po.totalAmount),
      orgId: po.orgId,
      requesterId: po.buyerId,
    });

    return this.findOne(id);
  }

  async resetPoStatus(poId: string) {
    return this.repository.resetPoStatus(poId);
  }

  async confirmPo(poId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
    });
    if (!po) throw new NotFoundException('PO not found');

    const updatedPo = await this.repository.confirmPoFromSupplier(poId);

    // Trigger automation to create GRN draft
    try {
      await this.automationService.handlePoSupplierAccepted(
        poId,
        po.supplierId,
      );
    } catch (automationError) {
      this.logger.error(
        'Failed to create GRN draft automatically',
        automationError,
      );
      // Don't fail the confirmation if automation fails
    }

    try {
      await this.supplierKpiService.evaluateSupplierPerformance(
        po.supplierId,
        po.orgId,
      );
    } catch (aiError) {
      this.logger.error('AI Evaluation failed, continuing flow', aiError);
    }

    if (po.prId) {
      await this.prisma.purchaseRequisition.update({
        where: { id: po.prId },
        data: { status: 'PO_CREATED' },
      });
    }

    return updatedPo;
  }

  async rejectPo(poId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
    });
    if (!po) throw new NotFoundException('PO not found');
    return this.repository.rejectPoFromSupplier(poId);
  }

  async updateStatus(id: string, status: PoStatus) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException('PO not found');

    return this.prisma.$transaction(async (tx) => {
      const isReleasingStatus =
        status === PoStatus.CANCELLED || status === PoStatus.REJECTED;
      const wasActiveStatus =
        po.status !== PoStatus.CANCELLED && po.status !== PoStatus.REJECTED;

      if (isReleasingStatus && wasActiveStatus) {
        if (po.costCenterId) {
          // Using a generic budget release if needed, or keeping existing logic
          // For now, keeping it simple to avoid breaking changes
        }
      }

      return tx.purchaseOrder.update({
        where: { id },
        data: { status },
      });
    });
  }

  async findAll(orgId: string) {
    return this.repository.findAll(orgId);
  }

  async findBySupplier(supplierId: string) {
    return this.repository.findBySupplier(supplierId);
  }

  async findOne(id: string) {
    return this.repository.findOne(id);
  }

  async findPaginated(orgId: string, skip: number, take: number) {
    return this.prisma.purchaseOrder.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { supplier: true },
    });
  }

  async count(orgId: string) {
    return this.prisma.purchaseOrder.count({
      where: { orgId },
    });
  }

  // ─── PO Consolidation ────────────────────────────────────────────────────────

  /**
   * Gộp nhiều PR đã duyệt thành 1 PO duy nhất, nhóm các item giống nhau lại.
   *
   * Luồng xử lý:
   *  1. Fetch + validate tất cả PR (phải APPROVED, cùng org)
   *  2. Gộp PR items theo chế độ: SKU_MATCH hoặc CATEGORY_MATCH
   *  3. Tính qty tổng, unitPrice = giá thấp nhất trong nhóm (đòn bẩy đàm phán)
   *  4. Reserve budget riêng từng costCenter (vì PR có thể từ nhiều phòng ban)
   *  5. Tạo PO + PoItem + PoItemSource (bảng truy vết) trong 1 transaction
   *  6. Cập nhật tất cả PR → PO_CREATED
   */
  async consolidatePRsIntoPO(dto: ConsolidatePRsDto, user: JwtPayload) {
    const {
      prIds,
      supplierId,
      consolidationMode = 'SKU_MATCH',
      deliveryDate,
      paymentTerms,
      deliveryAddress,
      notes,
    } = dto;

    // ── Bước 1: Lấy và validate tất cả PR ────────────────────────────────────
    const prs = await this.prisma.purchaseRequisition.findMany({
      where: { id: { in: prIds } },
      include: {
        items: {
          include: { category: true },
        },
      },
    });

    // Kiểm tra đủ số lượng PR
    if (prs.length !== prIds.length) {
      const foundIds = prs.map((p) => p.id);
      const missing = prIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Không tìm thấy các PR sau: ${missing.join(', ')}`,
      );
    }

    // Tất cả PR phải ở trạng thái APPROVED
    const nonApproved = prs.filter((p) => p.status !== 'APPROVED');
    if (nonApproved.length > 0) {
      throw new BadRequestException(
        `Các PR sau chưa được duyệt hoàn toàn: ${nonApproved.map((p) => p.prNumber).join(', ')}`,
      );
    }

    // Tất cả PR phải thuộc cùng 1 tổ chức (không thể mua chéo org)
    const orgIds = [...new Set(prs.map((p) => p.orgId))];
    if (orgIds.length > 1) {
      throw new BadRequestException(
        'Tất cả PR phải thuộc cùng một tổ chức để có thể gộp PO.',
      );
    }
    const orgId = orgIds[0];

    // ── Kiểm tra hợp đồng khung ACTIVE với nhà cung cấp ─────────────────────
    const activeContract =
      await this.contractService.findActiveBySupplierAndOrg(supplierId, orgId);

    if (!activeContract) {
      throw new BadRequestException(
        'Không tìm thấy hợp đồng khung ACTIVE với nhà cung cấp này. ' +
          'Vui lòng tạo hợp đồng khung trước, hoặc sử dụng luồng RFQ để đấu thầu.',
      );
    }

    if (
      activeContract.endDate &&
      new Date(activeContract.endDate) < new Date(deliveryDate)
    ) {
      throw new BadRequestException(
        `Hợp đồng khung (${activeContract.contractNumber}) sẽ hết hạn trước ngày giao hàng. ` +
          'Vui lòng gia hạn hợp đồng hoặc chọn ngày giao hàng sớm hơn.',
      );
    }

    // ── Bước 2: Gom tất cả PR items vào 1 danh sách phẳng ───────────────────
    // Đính kèm prId và costCenterId của PR mẹ vào từng item
    type FlatItem = {
      id: string;
      prId: string;
      sku: string | null;
      categoryId: string | null;
      productDesc: string;
      qty: number;
      unit: string;
      estimatedPrice: number;
      costCenterId: string | null;
    };

    const allItems: FlatItem[] = prs.flatMap((pr) =>
      pr.items.map((item) => ({
        id: item.id,
        prId: pr.id,
        sku: item.sku,
        categoryId: item.categoryId,
        productDesc: item.productDesc,
        qty: Number(item.qty),
        unit: item.unit,
        estimatedPrice: Number(item.estimatedPrice),
        // costCenterId lấy từ PR mẹ (mỗi PR thuộc 1 cost center)
        costCenterId: pr.costCenterId ?? null,
      })),
    );

    // ── Bước 3: Nhóm item theo matching key ──────────────────────────────────
    //
    // SKU_MATCH:
    //   key = sku nếu có; ngược lại dùng productDesc lowercase để fallback
    //   → Ví dụ: sku = "A4-GIAY-500" thì key = "A4-GIAY-500"
    //
    // CATEGORY_MATCH:
    //   key = categoryId nếu có; ngược lại dùng productDesc lowercase
    //   → Ví dụ: tất cả "văn phòng phẩm" (cùng categoryId) được gộp lại
    //
    const groups = new Map<string, FlatItem[]>();

    for (const item of allItems) {
      let matchKey: string;

      if (consolidationMode === 'SKU_MATCH') {
        matchKey = item.sku ?? `desc::${item.productDesc.toLowerCase().trim()}`;
      } else {
        // CATEGORY_MATCH
        matchKey =
          item.categoryId ?? `desc::${item.productDesc.toLowerCase().trim()}`;
      }

      if (!groups.has(matchKey)) groups.set(matchKey, []);
      groups.get(matchKey)!.push(item);
    }

    // ── Bước 4: Tổng hợp từng nhóm thành 1 PO item ──────────────────────────
    type ConsolidatedItem = {
      lineNumber: number;
      sku: string | null;
      description: string;
      unit: string;
      totalQty: number;
      unitPrice: number; // Giá thấp nhất trong nhóm
      total: number;
      sources: Array<{
        // Truy vết nguồn gốc từng PR
        prItemId: string;
        prId: string;
        contributedQty: number;
        costCenterId: string | null;
      }>;
    };

    const consolidatedItems: ConsolidatedItem[] = [];
    let lineNumber = 1;

    for (const [, items] of groups) {
      const totalQty = items.reduce((sum, i) => sum + i.qty, 0);

      // Dùng giá THẤP NHẤT trong nhóm làm unitPrice của PO item gộp
      // Lý do: khi mua số lượng lớn hơn, đàm phán được giá tốt hơn giá đơn lẻ cao nhất
      const unitPrice = Math.min(...items.map((i) => i.estimatedPrice));

      consolidatedItems.push({
        lineNumber: lineNumber++,
        sku: items[0].sku ?? null,
        description: items[0].productDesc,
        unit: items[0].unit,
        totalQty,
        unitPrice,
        total: totalQty * unitPrice,
        sources: items.map((i) => ({
          prItemId: i.id,
          prId: i.prId,
          contributedQty: i.qty,
          costCenterId: i.costCenterId,
        })),
      });
    }

    // ── Bước 5: Tính budget theo từng costCenter ─────────────────────────────
    //
    // Vì các PR có thể từ nhiều phòng ban khác nhau (nhiều costCenter),
    // cần tính xem mỗi costCenter phải trả bao nhiêu rồi reserve riêng.
    //
    // Ví dụ:
    //   PR-001 (CC-IT):   10 tờ giấy × 50,000 = 500,000
    //   PR-002 (CC-MKT):   5 tờ giấy × 50,000 = 250,000
    //   PR-003 (CC-HR):    3 tờ giấy × 50,000 = 150,000
    //   → CC-IT reserve 500,000 | CC-MKT reserve 250,000 | CC-HR reserve 150,000
    //
    const budgetByCostCenter = new Map<string, number>();

    for (const item of consolidatedItems) {
      for (const source of item.sources) {
        if (source.costCenterId) {
          const cost = source.contributedQty * item.unitPrice;
          budgetByCostCenter.set(
            source.costCenterId,
            (budgetByCostCenter.get(source.costCenterId) ?? 0) + cost,
          );
        }
      }
    }

    const totalAmount = consolidatedItems.reduce((sum, i) => sum + i.total, 0);

    // PO gộp có prefix PO-CONS để phân biệt với PO thường
    const poNumber = `PO-CONS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // ── Bước 6: Tạo PO + items + sources trong 1 transaction ─────────────────
    // Budget reservation xảy ra SAU transaction để nếu thất bại có thể compensate
    const po = await this.prisma.$transaction(async (tx) => {
      // A. Tạo PO gộp
      // prId để null vì PO này có nhiều PR nguồn (track qua PoItemSource)
      const newPo = await tx.purchaseOrder.create({
        data: {
          poNumber,
          orgId,
          supplierId,
          buyerId: user.sub,
          contractId: activeContract.id,
          status: PoStatus.DRAFT,
          totalAmount,
          currency: prs[0].currency,
          deliveryDate,
          paymentTerms: paymentTerms ?? null,
          deliveryAddress: deliveryAddress ?? null,
          notes:
            notes ??
            `PO gộp từ ${prIds.length} PR: ${prs.map((p) => p.prNumber).join(', ')}`,
        },
      });

      // B. Tạo từng PoItem gộp + PoItemSource tương ứng
      for (const item of consolidatedItems) {
        const poItem = await tx.poItem.create({
          data: {
            poId: newPo.id,
            lineNumber: item.lineNumber,
            sku: item.sku,
            description: item.description,
            qty: item.totalQty,
            unit: item.unit,
            unitPrice: item.unitPrice,
            total: item.total,
            // prItemId để null vì item này tổng hợp từ nhiều prItem
            // (chi tiết xem trong bảng po_item_sources)
          },
        });

        // C. Tạo PoItemSource — bảng truy vết từng PR item đóng góp vào PO item này
        // Mỗi row = 1 PR item gốc với số lượng đóng góp và costCenter của nó
        for (const source of item.sources) {
          await tx.poItemSource.create({
            data: {
              poItemId: poItem.id,
              prItemId: source.prItemId,
              prId: source.prId,
              contributedQty: source.contributedQty,
              costCenterId: source.costCenterId,
            },
          });
        }
      }

      // D. Cập nhật tất cả PR nguồn → PO_CREATED
      await tx.purchaseRequisition.updateMany({
        where: { id: { in: prIds } },
        data: { status: 'PO_CREATED' as PrStatus },
      });

      return newPo;
    });

    // ── Bước 7: Reserve budget SAU transaction (compensation nếu thất bại) ────
    // PO đã được tạo thành công. Giờ mới reserve budget từng costCenter.
    // Nếu reserve thất bại → xóa PO và reset PR về APPROVED (compensating transaction).
    const reservedCostCenters: Array<{ costCenterId: string; amount: number }> =
      [];
    try {
      for (const [costCenterId, amount] of budgetByCostCenter) {
        await this.budgetService.reserveBudget(
          costCenterId,
          orgId,
          amount,
          user,
        );
        reservedCostCenters.push({ costCenterId, amount });
        this.logger.log(
          `Reserved ${amount.toLocaleString('vi-VN')} VND for costCenter ${costCenterId}`,
        );
      }
    } catch (budgetError) {
      this.logger.error(
        `Budget reservation failed for consolidated PO ${po.poNumber}. Rolling back...`,
        budgetError,
      );
      // Giải phóng các budget đã reserve trước đó
      for (const { costCenterId, amount } of reservedCostCenters) {
        await this.budgetService
          .releaseBudget(costCenterId, orgId, amount, user)
          .catch((e: unknown) =>
            this.logger.error(
              `Failed to release budget for ${costCenterId}`,
              e,
            ),
          );
      }
      // Xóa PO vừa tạo và reset PR về APPROVED
      await this.prisma
        .$transaction(async (tx) => {
          await tx.poItemSource.deleteMany({ where: { prId: { in: prIds } } });
          await tx.poItem.deleteMany({ where: { poId: po.id } });
          await tx.purchaseOrder.delete({ where: { id: po.id } });
          await tx.purchaseRequisition.updateMany({
            where: { id: { in: prIds } },
            data: { status: PrStatus.APPROVED },
          });
        })
        .catch((e: unknown) =>
          this.logger.error(`Compensation rollback failed for PO ${po.id}`, e),
        );
      throw budgetError;
    }

    this.logger.log(
      `Created consolidated PO ${po.poNumber} from ${prIds.length} PRs, ` +
        `${consolidatedItems.length} merged items, total: ${totalAmount.toLocaleString('vi-VN')} VND`,
    );

    return {
      ...po,
      // Trả thêm thông tin tổng kết để client hiển thị
      consolidationSummary: {
        sourcePrCount: prIds.length,
        sourcePrNumbers: prs.map((p) => p.prNumber),
        mergedItemCount: consolidatedItems.length,
        totalOriginalItems: allItems.length,
        savedItems: allItems.length - consolidatedItems.length,
        totalAmount,
        budgetReservedByCostCenter: Object.fromEntries(budgetByCostCenter),
      },
    };
  }
}
