import { Module } from '@nestjs/common';
import { QualityController } from './quality.controller';
import { RcaController } from './rca.controller';
import { QualityTrendService } from './quality-trend.service';
import { RcaService } from './rca.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QualityController, RcaController],
  providers: [QualityTrendService, RcaService],
})
export class QualityModule {}
