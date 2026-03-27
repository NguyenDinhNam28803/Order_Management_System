import { Module } from '@nestjs/common';
import { OrganizationModuleService } from './organization-module.service';
import { OrganizationModuleController } from './organization-module.controller';
import { DepartmentController } from './department.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [OrganizationModuleController, DepartmentController],
  providers: [OrganizationModuleService],
})
export class OrganizationModuleModule {}
