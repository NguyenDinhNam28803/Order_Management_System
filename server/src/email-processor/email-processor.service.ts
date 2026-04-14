import { Injectable } from '@nestjs/common';
import { AiService } from '../ai-service/ai-service.service';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class EmailProcessorService {
  constructor(
    private aiService: AiService,
    private prisma: PrismaService,
  ) {}

  async processIncomingEmail(body: string) {
    const analysis = await this.aiService.analyzeEmailContent(body);

    if (analysis.confidence < 0.7) {
      console.warn('Low confidence email analysis, skipping auto-action');
      return { success: false, reason: 'Low confidence' };
    }

    if (analysis.intent === 'CREATE_PR') {
      return await this.createDraftPR(analysis.data);
    }

    return { success: false, message: 'Unsupported intent' };
  }
  private async createDraftPR(data: any) {
    // Logic tạo PR ở trạng thái DRAFT
    const pr = await this.prisma.purchaseRequisition.create({
      data: {
        prNumber: `PR-${Date.now()}`,
        title: data.description || 'Auto-generated from email',
        description: data.description || 'Auto-generated from email',
        status: 'DRAFT',
        orgId: randomBytes(16).toString('hex'),
        requesterId: randomBytes(16).toString('hex'),
        deptId: randomBytes(16).toString('hex'),
        items: {
          create: [
            {
              lineNumber: 1,
              qty: data.quantity || 1,
              productDesc: data.description || 'N/A',
              estimatedPrice: 0,
            }
          ]
        }
      }
    });
    return { success: true, prId: pr.id };
  }
}
