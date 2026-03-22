import { Module } from '@nestjs/common';
import { OrganizationModuleService } from './organization-module.service';
import { OrganizationModuleController } from './organization-module.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrganizationModuleController],
  providers: [OrganizationModuleService],
})
export class OrganizationModuleModule {}
