import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/roles.guard';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Departments')
@Controller('departments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Create a new department' })
  async create(@Body() createDto: CreateDepartmentDto) {
    const { orgId, parentDeptId, headUserId, ...rest } = createDto;
    const dept = await this.prisma.department.create({
      data: {
        ...rest,
        organization: { connect: { id: orgId } },
        ...(parentDeptId && { parent: { connect: { id: parentDeptId } } }),
        ...(headUserId && { head: { connect: { id: headUserId } } }),
      },
    });

    if (rest.costCenterCode) {
      await this.prisma.costCenter.updateMany({
        where: { code: rest.costCenterCode, orgId: dept.orgId },
        data: { deptId: dept.id },
      });
    }
    return dept;
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments' })
  async findAll(@Query('orgId') orgId?: string) {
    const where: any = {};
    if (orgId) where.orgId = orgId;
    return this.prisma.department.findMany({
      where,
      include: {
        organization: { select: { name: true } },
        head: { select: { fullName: true, id: true } },
      },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by ID' })
  async findOne(@Param('id') id: string) {
    return this.prisma.department.findUnique({
      where: { id },
      include: {
        organization: true,
        head: true,
        parent: true,
        children: true,
      },
    });
  }

  @Patch(':id')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Update department by ID' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDepartmentDto,
  ) {
    const { orgId, parentDeptId, headUserId, ...rest } = updateDto;
    const dept = await this.prisma.department.update({
      where: { id },
      data: {
        ...rest,
        ...(orgId && { organization: { connect: { id: orgId } } }),
        ...(parentDeptId && { parent: { connect: { id: parentDeptId } } }),
        ...(headUserId && { head: { connect: { id: headUserId } } }),
      },
    });

    if (rest.costCenterCode) {
      await this.prisma.costCenter.updateMany({
        where: { code: rest.costCenterCode, orgId: dept.orgId },
        data: { deptId: dept.id },
      });
    }
    return dept;
  }

  @Delete(':id')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Deactivate/Delete department' })
  async remove(@Param('id') id: string) {
    return this.prisma.department.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
