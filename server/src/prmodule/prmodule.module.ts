import { Module } from '@nestjs/common';
import { PrmoduleService } from './prmodule.service';
import { PrmoduleController } from './prmodule.controller';
import { PrRepository } from './pr.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [PrismaModule],
  controllers: [PrmoduleController],
  providers: [PrmoduleService, PrRepository, PrismaService],
  exports: [PrmoduleService],
})
export class PrmoduleModule {}
