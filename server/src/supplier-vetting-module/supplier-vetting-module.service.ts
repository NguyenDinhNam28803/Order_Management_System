import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalModuleService } from '../approval-module/approval-module.service';
import { DocumentType, SupplierTier, VettingStatus } from '@prisma/client';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import {
  CHECK_TYPES,
  CreateVettingRequestDto,
  UpdateVettingCheckDto,
  SubmitVettingDto,
  ApproveVettingDto,
  RejectVettingDto,
} from './dto/supplier-vetting.dto';

@Injectable()
export class SupplierVettingService {
  private readonly logger = new Logger(SupplierVettingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly approvalService: ApprovalModuleService,
  ) {}

  async createRequest(dto: CreateVettingRequestDto, user: JwtPayload) {
    const supplier = await this.prisma.organization.findUnique({
      where: { id: dto.supplierId },
    });
    if (!supplier) throw new NotFoundException('Nhà cung cấp không tồn tại');

    const vetting = await this.prisma.$transaction(async (tx) => {
      const req = await tx.supplierVettingRequest.create({
        data: {
          orgId: user.orgId,
          supplierId: dto.supplierId,
          requestedById: user.sub,
          assignedToId: dto.assignedToId,
          priceVsMarket: dto.priceVsMarket,
          notes: dto.notes,
          status: VettingStatus.IN_REVIEW,
        },
      });

      const checks = CHECK_TYPES.map((checkType) => ({
        vettingId: req.id,
        checkType,
        checkStatus: 'PENDING',
      }));
      await tx.supplierVettingCheck.createMany({ data: checks });

      await tx.organization.update({
        where: { id: dto.supplierId },
        data: { kycStatus: 'UNDER_REVIEW' },
      });

      return req;
    });

    return this.findOne(vetting.id);
  }

  async findAll(user: JwtPayload) {
    return this.prisma.supplierVettingRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: { select: { id: true, name: true, email: true, kycStatus: true, supplierTier: true } },
        requestedBy: { select: { id: true, fullName: true, email: true } },
        assignedTo: { select: { id: true, fullName: true, email: true } },
        checks: { select: { checkType: true, checkStatus: true } },
      },
    });
  }

  async findOne(id: string) {
    const vetting = await this.prisma.supplierVettingRequest.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true, email: true, phone: true, address: true, kycStatus: true, supplierTier: true } },
        requestedBy: { select: { id: true, fullName: true, email: true } },
        assignedTo: { select: { id: true, fullName: true, email: true } },
        checks: {
          include: {
            verifiedBy: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: { checkType: 'asc' },
        },
      },
    });
    if (!vetting) throw new NotFoundException('Vetting request không tồn tại');
    return vetting;
  }

  async updateCheck(
    vettingId: string,
    checkId: string,
    dto: UpdateVettingCheckDto,
    user: JwtPayload,
  ) {
    const vetting = await this.prisma.supplierVettingRequest.findUnique({
      where: { id: vettingId },
    });
    if (!vetting) throw new NotFoundException('Vetting request không tồn tại');
    if (vetting.status === VettingStatus.APPROVED || vetting.status === VettingStatus.REJECTED) {
      throw new BadRequestException('Không thể cập nhật check khi đã kết thúc');
    }

    const check = await this.prisma.supplierVettingCheck.findFirst({
      where: { id: checkId, vettingId },
    });
    if (!check) throw new NotFoundException('Check item không tồn tại');

    return this.prisma.supplierVettingCheck.update({
      where: { id: checkId },
      data: {
        checkStatus: dto.checkStatus,
        fileUrl: dto.fileUrl,
        notes: dto.notes,
        verifiedById: user.sub,
        verifiedAt: new Date(),
      },
    });
  }

  async submitForApproval(id: string, dto: SubmitVettingDto, user: JwtPayload) {
    const vetting = await this.prisma.supplierVettingRequest.findUnique({
      where: { id },
    });
    if (!vetting) throw new NotFoundException('Vetting request không tồn tại');
    if (vetting.status !== VettingStatus.IN_REVIEW) {
      throw new BadRequestException('Chỉ có thể submit khi đang IN_REVIEW');
    }

    await this.prisma.supplierVettingRequest.update({
      where: { id },
      data: {
        status: VettingStatus.PENDING_APPROVAL,
        overallScore: dto.overallScore,
        notes: dto.notes ?? vetting.notes,
      },
    });

    try {
      await this.approvalService.initiateWorkflow({
        docType: DocumentType.SUPPLIER_VETTING,
        docId: id,
        totalAmount: 0,
        orgId: user.orgId,
        requesterId: user.sub,
        user,
      });
    } catch (err) {
      this.logger.warn(`Approval workflow failed for vetting ${id}: ${err}`);
    }

    return this.findOne(id);
  }

  async approve(id: string, dto: ApproveVettingDto, user: JwtPayload) {
    const vetting = await this.prisma.supplierVettingRequest.findUnique({
      where: { id },
    });
    if (!vetting) throw new NotFoundException('Vetting request không tồn tại');
    if (vetting.status !== VettingStatus.PENDING_APPROVAL && vetting.status !== VettingStatus.IN_REVIEW) {
      throw new BadRequestException('Không thể approve ở trạng thái hiện tại');
    }

    await this.prisma.$transaction([
      this.prisma.supplierVettingRequest.update({
        where: { id },
        data: { status: VettingStatus.APPROVED, notes: dto.notes ?? vetting.notes },
      }),
      this.prisma.organization.update({
        where: { id: vetting.supplierId },
        data: {
          kycStatus: 'APPROVED',
          supplierTier: dto.supplierTier as SupplierTier,
          kycVerifiedAt: new Date(),
          kycVerifiedById: user.sub,
        },
      }),
    ]);

    return this.findOne(id);
  }

  async reject(id: string, dto: RejectVettingDto, user: JwtPayload) {
    const vetting = await this.prisma.supplierVettingRequest.findUnique({
      where: { id },
    });
    if (!vetting) throw new NotFoundException('Vetting request không tồn tại');
    if (vetting.status === VettingStatus.APPROVED || vetting.status === VettingStatus.REJECTED) {
      throw new BadRequestException('Vetting đã kết thúc');
    }

    await this.prisma.$transaction([
      this.prisma.supplierVettingRequest.update({
        where: { id },
        data: { status: VettingStatus.REJECTED, rejectedReason: dto.rejectedReason },
      }),
      this.prisma.organization.update({
        where: { id: vetting.supplierId },
        data: { kycStatus: 'REJECTED' },
      }),
    ]);

    return this.findOne(id);
  }

  async cancel(id: string, user: JwtPayload) {
    const vetting = await this.prisma.supplierVettingRequest.findUnique({
      where: { id },
    });
    if (!vetting) throw new NotFoundException('Vetting request không tồn tại');
    if (vetting.status === VettingStatus.APPROVED || vetting.status === VettingStatus.CANCELLED) {
      throw new BadRequestException('Không thể huỷ ở trạng thái này');
    }

    return this.prisma.supplierVettingRequest.update({
      where: { id },
      data: { status: VettingStatus.CANCELLED },
    });
  }
}
