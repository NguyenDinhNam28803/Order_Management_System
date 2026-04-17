import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

export enum TokenType {
  RFQ_QUOTE = 'RFQ_QUOTE',
  PO_CONFIRM = 'PO_CONFIRM',
  GRN_MILESTONE = 'GRN_MILESTONE',
  INVOICE_SUBMIT = 'INVOICE_SUBMIT',
}

export interface CreateExternalTokenDto {
  type: TokenType;
  referenceId: string;
  targetEmail: string;
  metadata?: Record<string, any>;
  expiresInDays?: number;
}

export interface ExternalTokenResult {
  id: string;
  token: string;
  type: TokenType;
  referenceId: string;
  targetEmail: string;
  expiresAt: Date;
  link: string;
}

@Injectable()
export class ExternalTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async createToken(dto: CreateExternalTokenDto): Promise<ExternalTokenResult> {
    const {
      type,
      referenceId,
      targetEmail,
      metadata = {},
      expiresInDays = 7,
    } = dto;

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    );

    const created = await this.prisma.externalToken.create({
      data: {
        token,
        type,
        referenceId,
        targetEmail,
        metadata,
        expiresAt,
      },
    });

    return {
      id: created.id,
      token: created.token,
      type: created.type as TokenType,
      referenceId: created.referenceId,
      targetEmail: created.targetEmail,
      expiresAt: created.expiresAt,
      link: this.generateLink(type, token),
    };
  }

  async validateToken(token: string): Promise<ExternalTokenResult> {
    const record = await this.prisma.externalToken.findUnique({
      where: { token },
    });

    if (!record) {
      throw new NotFoundException('Token không tồn tại hoặc đã hết hạn');
    }
    if (new Date() > record.expiresAt) {
      throw new BadRequestException('Token đã hết hạn');
    }
    if (record.usedAt) {
      throw new BadRequestException('Token đã được sử dụng');
    }

    return {
      id: record.id,
      token: record.token,
      type: record.type as TokenType,
      referenceId: record.referenceId,
      targetEmail: record.targetEmail,
      expiresAt: record.expiresAt,
      link: this.generateLink(record.type as TokenType, record.token),
    };
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await this.prisma.externalToken.update({
      where: { token },
      data: { usedAt: new Date() },
    });
  }

  async revokeToken(token: string): Promise<void> {
    await this.prisma.externalToken.delete({
      where: { token },
    });
  }

  async getActiveTokensByReference(
    referenceId: string,
    type?: TokenType,
  ): Promise<ExternalTokenResult[]> {
    const records = await this.prisma.externalToken.findMany({
      where: {
        referenceId,
        expiresAt: { gt: new Date() },
        usedAt: null,
        ...(type ? { type } : {}),
      },
    });

    return records.map((r) => ({
      id: r.id,
      token: r.token,
      type: r.type as TokenType,
      referenceId: r.referenceId,
      targetEmail: r.targetEmail,
      expiresAt: r.expiresAt,
      link: this.generateLink(r.type as TokenType, r.token),
    }));
  }

  private generateLink(type: TokenType, token: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'https://your-domain.com';

    const pathMap: Record<TokenType, string> = {
      [TokenType.RFQ_QUOTE]: '/rfq/quote',
      [TokenType.PO_CONFIRM]: '/po/confirm',
      [TokenType.GRN_MILESTONE]: '/grn/update',
      [TokenType.INVOICE_SUBMIT]: '/invoice/submit',
    };

    return `${baseUrl}${pathMap[type] ?? '/external'}?token=${token}`;
  }

  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.externalToken.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }],
      },
    });
    return result.count;
  }
}
