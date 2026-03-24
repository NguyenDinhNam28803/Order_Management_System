import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCostCenterDto,
  UpdateCostCenterDto,
} from './dto/cost-center.dto';

@Injectable()
export class CostCenterModuleService {
  constructor(private prisma: PrismaService) {}

  async create(createCostCenterDto: CreateCostCenterDto) {
    // Check if code already exists in org
    const existing = await this.prisma.costCenter.findUnique({
      where: {
        orgId_code: {
          orgId: createCostCenterDto.orgId,
          code: createCostCenterDto.code,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Cost Center code already exists in this organization',
      );
    }

    return this.prisma.costCenter.create({
      data: {
        ...createCostCenterDto,
      },
    });
  }

  async findWithDeptId(dept_Id: string) {
    return this.prisma.costCenter.findFirst({
      where: {
        deptId: dept_Id,
      },
      include: {
        department: true,
        budgetAllocations: true,
      },
    });
  }

  async findAll(orgId: string) {
    return this.prisma.costCenter.findMany({
      where: { orgId },
      include: {
        department: true,
        budgetAllocations: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const costCenter = await this.prisma.costCenter.findUnique({
      where: { id },
      include: {
        department: true,
        budgetAllocations: true,
      },
    });

    if (!costCenter) {
      throw new NotFoundException(`Cost Center with ID ${id} not found`);
    }

    return costCenter;
  }

  async update(id: string, updateCostCenterDto: UpdateCostCenterDto) {
    await this.findOne(id);

    return this.prisma.costCenter.update({
      where: { id },
      data: updateCostCenterDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.costCenter.delete({
      where: { id },
    });
  }
}
