import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePrDto } from './dto/create-pr.dto';
import { PrRepository } from './pr.repository';
import { PrStatus, PurchaseRequisition, DocumentType } from '@prisma/client';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalModuleService } from '../approval-module/approval-module.service';
import { AiService } from '../ai-service/ai-service.service';

@Injectable()
export class PrmoduleService {
  constructor(
    private readonly repository: PrRepository,
    private readonly prisma: PrismaService,
    private readonly approvalService: ApprovalModuleService,
    private readonly aiService: AiService,
  ) {}

  async create(
    createPrDto: CreatePrDto,
    user: JwtPayload,
  ): Promise<PurchaseRequisition> {
    const prNumber = `PR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Giả sử user object có orgId và deptId từ JWT payload
    const orgId = user.orgId;
    let deptId = user.deptId;

    if (!deptId) {
      const userFromDb = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { deptId: true },
      });
      if (!userFromDb?.deptId) {
        throw new Error('User does not belong to any department');
      }
      deptId = userFromDb.deptId;
    }

    // AI gợi ý công ty phù hợp dựa trên mô tả sản phẩm
    const aiSuggestion = await this.aiService.getCompanySuggestion(
      createPrDto.items,
    );
    console.log('AI Suggestion:', aiSuggestion);

    return this.repository.create(
      createPrDto,
      user.sub,
      orgId,
      deptId,
      prNumber,
    );
  }

  async findAll(user: JwtPayload): Promise<PurchaseRequisition[]> {
    return this.repository.findAll(user.orgId);
  }

  async findOne(id: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const pr = await this.repository.findOne(id);
    if (!pr) {
      throw new NotFoundException(
        `Purchase Requisition with ID ${id} not found`,
      );
    }
    return pr;
  }

  async submit(id: string): Promise<PurchaseRequisition> {
    if (!id) {
      throw new NotFoundException(`Purchase Requisition ID is required`);
    }

    // 1. Tìm PR
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const pr = await this.findOne(id);
    if (pr.status !== PrStatus.DRAFT) {
      throw new Error('Only draft PRs can be submitted');
    }

    // 2. Kích hoạt luồng duyệt (Multi-level Approval)
    await this.approvalService.initiateWorkflow({
      docType: DocumentType.PURCHASE_REQUISITION,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      docId: pr.id,
      totalAmount: Number(pr.totalEstimate),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      orgId: pr.orgId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      requesterId: pr.requesterId,
    });

    // 3. Trạng thái PENDING_APPROVAL đã được cập nhật bên trong initiateWorkflow
    // nhưng ta vẫn trả về PR mới nhất để đồng bộ UI
    return this.findOne(id);
  }

  async findMyPrs(userId: string): Promise<PurchaseRequisition[]> {
    return this.repository.findByRequester(userId);
  }
}
