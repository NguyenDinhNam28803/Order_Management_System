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

<<<<<<< HEAD
=======
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

>>>>>>> 2a33e5440bf544c21f0e020a6d254b6bc39af67e
  async findAll(orgId: string) {
    return this.prisma.costCenter.findMany({
      where: { orgId },
      include: {
        department: true,
<<<<<<< HEAD
=======
        budgetAllocations: true,
>>>>>>> 2a33e5440bf544c21f0e020a6d254b6bc39af67e
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const costCenter = await this.prisma.costCenter.findUnique({
      where: { id },
      include: {
        department: true,
<<<<<<< HEAD
=======
        budgetAllocations: true,
>>>>>>> 2a33e5440bf544c21f0e020a6d254b6bc39af67e
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
