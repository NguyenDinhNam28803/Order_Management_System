import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCostCenterDto,
  UpdateCostCenterDto,
} from './dto/cost-center.dto';

@Injectable()
export class CostCenterModuleService {
  constructor(private prisma: PrismaService) {}

  // Helper chuyển đổi Decimal sang Number cho Frontend
  private mapCostCenter(cc: any) {
    if (!cc) return null;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const mapped = {
      ...cc,

      budgetAnnual: cc.budgetAnnual ? Math.round(Number(cc.budgetAnnual)) : 0,

      budgetUsed: cc.budgetUsed ? Math.round(Number(cc.budgetUsed)) : 0,
    };

    if (cc.budgetAllocations && Array.isArray(cc.budgetAllocations)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      mapped.budgetAllocations = cc.budgetAllocations.map((alloc: any) => ({
        ...alloc,

        allocatedAmount: Number(alloc.allocatedAmount || 0),

        committedAmount: Number(alloc.committedAmount || 0),

        spentAmount: Number(alloc.spentAmount || 0),
      }));
    } else {
      mapped.budgetAllocations = [];
    }

    return mapped;
  }

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
        'Mã Cost Center đã tồn tại trong tổ chức này',
      );
    }

    const { deptId, ...rest } = createCostCenterDto;
    const sanitizedDeptId = deptId === '' ? null : deptId;

    const result = await this.prisma.costCenter.create({
      data: {
        ...rest,
        deptId: sanitizedDeptId,
      },
      include: { department: true },
    });

    return this.mapCostCenter(result);
  }

  async findWithDeptId(dept_Id: string) {
    const results = await this.prisma.costCenter.findMany({
      where: {
        deptId: dept_Id,
        isActive: true,
      },
      include: {
        department: true,
        budgetAllocations: true,
      },
    });
    return results.map((cc) => this.mapCostCenter(cc));
  }

  async findAll(orgId: string) {
    if (!orgId) {
      console.warn(
        '[CostCenterModuleService] findAll called with missing orgId',
      );
      return [];
    }

    try {
      const results = await this.prisma.costCenter.findMany({
        where: {
          orgId,
          isActive: true,
        },
        include: {
          department: true,
          budgetAllocations: {
            include: { budgetPeriod: true },
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      return results.map((cc) => this.mapCostCenter(cc));
    } catch (error: any) {
      console.error('[CostCenterModuleService] findAll error:', error);
      throw new BadRequestException(
        'Không thể tải danh sách trung tâm chi phí: ' + error.message,
      );
    }
  }

  async findOne(id: string) {
    try {
      const costCenter = await this.prisma.costCenter.findUnique({
        where: { id },
        include: {
          department: true,
        },
      });

      if (!costCenter) {
        throw new NotFoundException(`Cost Center with ID ${id} not found`);
      }

      const allocations = await this.prisma.budgetAllocation
        .findMany({
          where: { costCenterId: id },
          include: { budgetPeriod: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        })
        .catch(() => []);

      return this.mapCostCenter({
        ...costCenter,
        budgetAllocations: allocations,
      });
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        `Lỗi hệ thống khi truy vấn Trung tâm chi phí: ${error.message}`,
      );
    }
  }

  async update(id: string, updateCostCenterDto: UpdateCostCenterDto) {
    try {
      await this.findOne(id);

      const { budgetAnnual, deptId, ...rest } = updateCostCenterDto;
      const sanitizedDeptId = deptId === '' ? null : deptId;

      const result = await this.prisma.costCenter.update({
        where: { id },
        data: {
          ...rest,
          deptId: sanitizedDeptId,
          ...(budgetAnnual !== undefined && {
            budgetAnnual: Number(budgetAnnual),
          }),
        },
        include: { department: true, budgetAllocations: true },
      });

      return this.mapCostCenter(result);
    } catch (error: any) {
      console.error(`[CostCenterModuleService] update error for ${id}:`, error);
      throw new BadRequestException(
        `Không thể cập nhật Cost Center: ${error.message}`,
      );
    }
  }

  async remove(id: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const cc = await this.findOne(id);

      const hasAllocations = await this.prisma.budgetAllocation.count({
        where: { costCenterId: id },
      });

      const hasPRs = await this.prisma.purchaseRequisition.count({
        where: { costCenterId: id },
      });

      const hasPOs = await this.prisma.purchaseOrder.count({
        where: { costCenterId: id },
      });

      if (hasAllocations > 0 || hasPRs > 0 || hasPOs > 0) {
        // Thay vì throw 409, ta trả về thành công kèm thông báo chuyển trạng thái
        const updatedCC = await this.prisma.costCenter.update({
          where: { id },
          data: { isActive: false },
        });

        const reasons: string[] = [];
        if (hasAllocations > 0) reasons.push('Ngân sách');
        if (hasPRs > 0) reasons.push('Yêu cầu mua hàng (PR)');
        if (hasPOs > 0) reasons.push('Đơn mua hàng (PO)');

        return {
          ...this.mapCostCenter(updatedCC),
          isSoftDeleted: true,
          message: `Trung tâm chi phí '${cc.name}' đã có dữ liệu liên kết (${reasons.join(', ')}). Hệ thống đã chuyển sang trạng thái 'Ngưng hoạt động'.`,
        };
      }

      return await this.prisma.costCenter.delete({
        where: { id },
      });
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      if (error.code === 'P2003') {
        throw new ConflictException(
          'Lỗi ràng buộc: Dữ liệu này đang được sử dụng ở phân hệ khác.',
        );
      }
      throw new BadRequestException(
        `Không thể hoàn tất yêu cầu xóa: ${error.message}`,
      );
    }
  }
}
