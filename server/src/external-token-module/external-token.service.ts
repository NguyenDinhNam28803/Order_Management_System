import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

// Token types for external access
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

  /**
   * Tạo external token và link cho vendor/external user
   */
  async createToken(dto: CreateExternalTokenDto): Promise<ExternalTokenResult> {
    const { type, referenceId, targetEmail, metadata = {}, expiresInDays = 7 } = dto;

    // Generate random token (32 bytes = 64 hex characters)
    const token = randomBytes(32).toString('hex');
    
    // Calculate expiration date
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    // Create token record using raw query since externalToken may not be in Prisma client yet
    const externalToken = await this.prisma.$executeRawUnsafe(`
      INSERT INTO "ExternalToken" (id, token, type, "referenceId", "targetEmail", metadata, "expiresAt", "createdAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, token, type, "referenceId", "targetEmail", metadata, "expiresAt", "createdAt", "usedAt"
    `, token, type, referenceId, targetEmail, JSON.stringify(metadata), expiresAt) as any;
    
    // For now, query it back
    const createdToken = await this.prisma.$queryRawUnsafe(`
      SELECT * FROM "ExternalToken" WHERE token = $1
    `, token) as any[];
    
    if (!createdToken || createdToken.length === 0) {
      throw new BadRequestException('Failed to create token');
    }
    
    const externalTokenRecord = createdToken[0];

    // Generate link based on type and frontend URL
    const link = this.generateLink(type, token);

    return {
      id: externalTokenRecord.id,
      token: externalTokenRecord.token,
      type: externalTokenRecord.type,
      referenceId: externalTokenRecord.referenceId,
      targetEmail: externalTokenRecord.targetEmail,
      expiresAt: externalTokenRecord.expiresAt,
      link,
    };
  }

  /**
   * Validate và lấy thông tin token
   */
  async validateToken(token: string): Promise<ExternalTokenResult> {
    const tokens = await this.prisma.$queryRawUnsafe(`
      SELECT * FROM "ExternalToken" WHERE token = $1
    `, token) as any[];

    if (!tokens || tokens.length === 0) {
      throw new NotFoundException('Token không tồn tại hoặc đã hết hạn');
    }

    const externalToken = tokens[0];

    // Check if token is expired
    if (new Date() > new Date(externalToken.expiresAt)) {
      throw new BadRequestException('Token đã hết hạn');
    }

    // Check if token is already used
    if (externalToken.usedAt) {
      throw new BadRequestException('Token đã được sử dụng');
    }

    return {
      id: externalToken.id,
      token: externalToken.token,
      type: externalToken.type,
      referenceId: externalToken.referenceId,
      targetEmail: externalToken.targetEmail,
      expiresAt: externalToken.expiresAt,
      link: this.generateLink(externalToken.type, externalToken.token),
    };
  }

  /**
   * Mark token as used
   */
  async markTokenAsUsed(token: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(`
      UPDATE "ExternalToken" SET "usedAt" = NOW() WHERE token = $1
    `, token);
  }

  /**
   * Revoke/delete token
   */
  async revokeToken(token: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(`
      DELETE FROM "ExternalToken" WHERE token = $1
    `, token);
  }

  /**
   * Get all active tokens by reference
   */
  async getActiveTokensByReference(
    referenceId: string,
    type?: TokenType,
  ): Promise<ExternalTokenResult[]> {
    const tokens = await this.prisma.$queryRawUnsafe(`
      SELECT * FROM "ExternalToken"
      WHERE "referenceId" = $1
        AND "expiresAt" > NOW()
        AND "usedAt" IS NULL
        ${type ? `AND type = '${type}'` : ''}
    `, referenceId) as any[];

    return tokens.map((t) => ({
      id: t.id,
      token: t.token,
      type: t.type,
      referenceId: t.referenceId,
      targetEmail: t.targetEmail,
      expiresAt: t.expiresAt,
      link: this.generateLink(t.type, t.token),
    }));
  }

  /**
   * Generate frontend link based on token type
   */
  private generateLink(type: TokenType, token: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'https://your-domain.com';
    
    const pathMap: Record<TokenType, string> = {
      [TokenType.RFQ_QUOTE]: '/rfq/quote',
      [TokenType.PO_CONFIRM]: '/po/confirm',
      [TokenType.GRN_MILESTONE]: '/grn/update',
      [TokenType.INVOICE_SUBMIT]: '/invoice/submit',
    };

    const path = pathMap[type] || '/external';
    return `${baseUrl}${path}?token=${token}`;
  }

  /**
   * Cleanup expired tokens (chạy cron job định kỳ)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.prisma.$executeRawUnsafe(`
      DELETE FROM "ExternalToken"
      WHERE "expiresAt" < NOW() OR "usedAt" IS NOT NULL
    `);

    return result as number;
  }
}
