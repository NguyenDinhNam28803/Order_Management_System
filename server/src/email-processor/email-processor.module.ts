import { Module } from '@nestjs/common';
import { EmailProcessorService } from './email-processor.service';
import { EmailListenerService } from './email-listener.service';
import { AiService } from '../ai-service/ai-service.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [
    EmailProcessorService,
    EmailListenerService,
    AiService,
    PrismaService,
    ConfigService,
  ],
  exports: [EmailProcessorService],
})
export class EmailProcessorModule {}
