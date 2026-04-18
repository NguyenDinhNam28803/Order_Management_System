import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ContractStatus, DocumentType, ApprovalStatus } from '@prisma/client';
import { NotificationModuleService } from '../notification-module/notification-module.service';

@Injectable()
export class ContractModuleService {
  private readonly logger = new Logger(ContractModuleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationModuleService,
  ) {}

  async create(
    createContractDto: CreateContractDto,
    userId: string,
    orgId: string,
  ) {
    const { milestones, ...contractData } = createContractDto;
    const contractNumber = `CON-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return this.prisma.contract.create({
      data: {
        ...contractData,
        contractNumber,
        orgId,
        createdById: userId,
        milestones: milestones
          ? {
              create: milestones.map((m) => ({
                ...m,
                dueDate: new Date(m.dueDate),
              })),
            }
          : undefined,
      },
      include: { milestones: true },
    });
  }

  async submitForApproval(id: string, approverId: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Hợp đồng không tồn tại');
    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException(
        'Chỉ hợp đồng nháp mới có thể gửi phê duyệt',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái hợp đồng
      const updatedContract = await tx.contract.update({
        where: { id },
        data: { status: ContractStatus.PENDING_SIGNATURE },
      });

      // 2. Tạo bản ghi luồng phê duyệt
      await tx.approvalWorkflow.create({
        data: {
          documentType: DocumentType.CONTRACT,
          documentId: id,
          step: 1,
          approverId,
          status: ApprovalStatus.PENDING,
        },
      });

      return updatedContract;
    });
  }

  async findAll(orgId: string) {
    return this.prisma.contract.findMany({
      where: { orgId },
      include: { milestones: true, buyerOrg: true, supplierOrg: true },
    });
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: { milestones: true, buyerOrg: true, supplierOrg: true },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async update(id: string, updateContractDto: UpdateContractDto) {
    const { milestones, ...contractData } = updateContractDto;

    return this.prisma.$transaction(async (tx) => {
      // Nếu có cập nhật milestones, xóa cũ tạo mới hoặc xử lý update
      if (milestones) {
        await tx.contractMilestone.deleteMany({
          where: { contractId: id },
        });
      }

      return tx.contract.update({
        where: { id },
        data: {
          ...contractData,
          milestones: milestones
            ? {
                create: milestones.map((m) => ({
                  ...m,
                  dueDate: new Date(m.dueDate),
                })),
              }
            : undefined,
        },
        include: { milestones: true },
      });
    });
  }

  async signContract(id: string, userId: string, isBuyer: boolean) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Hợp đồng không tồn tại');

    const updateData: any = {};
    if (isBuyer) {
      updateData.signedByBuyerId = userId;
    } else {
      updateData.signedBySupplierId = userId;
    }

    // Nếu cả hai bên đã ký, chuyển trạng thái sang ACTIVE
    const updatedContract = await this.prisma.contract.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: updateData,
    });

    if (updatedContract.signedByBuyerId && updatedContract.signedBySupplierId) {
      return this.prisma.contract.update({
        where: { id },
        data: {
          status: ContractStatus.ACTIVE,
          signedAt: new Date(),
        },
      });
    }

    return updatedContract;
  }

  async updateMilestone(
    milestoneId: string,
    data: { status: string; completionDate?: Date },
  ) {
    return this.prisma.contractMilestone.update({
      where: { id: milestoneId },
      data: {
        status: data.status,
        completionDate: data.completionDate
          ? new Date(data.completionDate)
          : undefined,
      },
    });
  }

  async findBySupplier(supplierId: string) {
    return this.prisma.contract.findMany({
      where: { supplierId },
      include: { milestones: true, buyerOrg: true },
    });
  }

  async findActiveBySupplierAndOrg(supplierId: string, orgId: string) {
    return this.prisma.contract.findFirst({
      where: { supplierId, orgId, status: ContractStatus.ACTIVE },
      select: { id: true, contractNumber: true, endDate: true, value: true },
    });
  }

  async remove(id: string) {
    // Prisma sẽ tự động xóa milestones nếu bạn cấu hình onDelete: Cascade trong schema
    // Nếu không, hãy xóa thủ công trong transaction
    return this.prisma.$transaction(async (tx) => {
      await tx.contractMilestone.deleteMany({ where: { contractId: id } });
      return tx.contract.delete({ where: { id } });
    });
  }

  @Cron('0 8 * * *')
  async checkContractExpiry() {
    try {
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const expiringContracts = await this.prisma.contract.findMany({
        where: {
          status: ContractStatus.ACTIVE,
          endDate: { gte: now, lte: in30Days },
        },
        include: { supplierOrg: true },
      });

      if (expiringContracts.length === 0) return;

      const orgIds = [...new Set(expiringContracts.map((c) => c.orgId))];

      for (const orgId of orgIds) {
        const procurementUsers = await this.prisma.user.findMany({
          where: {
            orgId,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            role: { in: ['PROCUREMENT', 'ADMIN'] as any },
            isActive: true,
          },
        });

        const orgContracts = expiringContracts.filter((c) => c.orgId === orgId);

        for (const contract of orgContracts) {
          const daysLeft = Math.ceil(
            (contract.endDate!.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const supplierName =
            (contract.supplierOrg as any)?.name ?? 'Nhà cung cấp';

          for (const user of procurementUsers) {
            if (!user.email) continue;
            await this.notificationService
              .sendDirectEmail(
                user.email,
                `[Cảnh báo] Hợp đồng ${contract.contractNumber} sắp hết hạn`,
                'CONTRACT_EXPIRY_WARNING',
                {
                  name: user.fullName || user.email,
                  contractCode: contract.contractNumber,
                  contractTitle: contract.title,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  supplierName,
                  expiryDate: contract.endDate,
                  daysLeft,
                  loginUrl:
                    process.env['FRONTEND_URL'] ?? 'http://procuresmart.io.vn/',
                },
              )
              .catch(() => {});
          }
        }
      }

      this.logger.log(
        `Contract expiry check: ${expiringContracts.length} contracts notified`,
      );
    } catch (err: any) {
      this.logger.error(`checkContractExpiry failed: ${err.message}`);
    }
  }
}
