import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ContractStatus, DocumentType, ApprovalStatus } from '@prisma/client';

@Injectable()
export class ContractModuleService {
  constructor(private readonly prisma: PrismaService) {}

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

  async remove(id: string) {
    // Prisma sẽ tự động xóa milestones nếu bạn cấu hình onDelete: Cascade trong schema
    // Nếu không, hãy xóa thủ công trong transaction
    return this.prisma.$transaction(async (tx) => {
      await tx.contractMilestone.deleteMany({ where: { contractId: id } });
      return tx.contract.delete({ where: { id } });
    });
  }
}
