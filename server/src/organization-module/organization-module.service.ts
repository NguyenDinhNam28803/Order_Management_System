import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationModuleService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateOrganizationDto) {
    const existing = await this.prisma.organization.findUnique({
      where: { code: createDto.code },
    });
    if (existing) {
      throw new ConflictException('Organization with this code already exists');
    }
    return this.prisma.organization.create({
      data: createDto,
    });
  }

  async findAll(query: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { isActive, companyType, search } = query;
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    if (companyType) where.companyType = companyType;
    if (search) {
      where.OR = [
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        { name: { contains: search, mode: 'insensitive' } },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return this.prisma.organization.findMany({ where });
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        users: true,
        costCenters: true,
        departments: true,
        rfqSuppliers: true,
      },
    });
    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }
    return org;
  }

  async update(id: string, updateDto: UpdateOrganizationDto) {
    await this.findOne(id); // Ensure exists
    return this.prisma.organization.update({
      where: { id },
      data: updateDto,
    });
  }

  async submitForReview(id: string) {
    return this.prisma.organization.update({
      where: { id },
      data: { supplierTier: 'PENDING' }, // Đã là PENDING, có thể cần status trung gian nếu cần, nhưng tạm giữ tier.
    });
  }

  async approveSupplier(id: string, approverId: string) {
    // Role: PROCUREMENT/PLATFORM_ADMIN
    return this.prisma.organization.update({
      where: { id },
      data: {
        supplierTier: 'APPROVED',
        isActive: true,
        kycStatus: 'APPROVED',
        kycVerifiedById: approverId,
        kycVerifiedAt: new Date(),
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async rejectSupplier(id: string, reason: string) {
    // Role: PROCUREMENT/PLATFORM_ADMIN
    return this.prisma.organization.update({
      where: { id },
      data: {
        supplierTier: 'DISQUALIFIED',
        isActive: false,
        kycStatus: 'REJECTED',
      },
    });
  }
}
