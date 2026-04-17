import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
    const {
      type,
      referenceId,
      targetEmail,
      metadata = {},
      expiresInDays = 7,
    } = dto;

    // Generate random token (32 bytes = 64 hex characters)
    const token = randomBytes(32).toString('hex');

    // Calculate expiration date
    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    );

    // Create token record using raw query since externalToken may not be in Prisma client yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const _externalToken = (await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO "ExternalToken" (id, token, type, "referenceId", "targetEmail", metadata, "expiresAt", "createdAt")
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, token, type, "referenceId", "targetEmail", metadata, "expiresAt", "createdAt", "usedAt"
    `,
      token,
      type,
      referenceId,
      targetEmail,
      JSON.stringify(metadata),
      expiresAt,
    )) as any;

    // For now, query it back
    const createdToken = await this.prisma.$queryRawUnsafe(
      `
      SELECT * FROM "ExternalToken" WHERE token = $1
    `,
      token,
    );

    if (!createdToken) {
      throw new BadRequestException('Failed to create token');
    }

    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    const externalTokenRecord = createdToken[0];
    const tokenId: string = externalTokenRecord.id;
    const tokenVal: string = externalTokenRecord.token;
    const tokenType: TokenType = externalTokenRecord.type;
    const tokenRefId: string = externalTokenRecord.referenceId;
    const tokenEmail: string = externalTokenRecord.targetEmail;
    const tokenExpiry: Date = externalTokenRecord.expiresAt;
    /* eslint-enable @typescript-eslint/no-unsafe-assignment */

    // Generate link based on type and frontend URL
    const link = this.generateLink(type, token);

    return {
      id: tokenId,
      token: tokenVal,
      type: tokenType,
      referenceId: tokenRefId,
      targetEmail: tokenEmail,
      expiresAt: tokenExpiry,
      link,
    };
  }

  /**
   * Validate và lấy thông tin token
   */
  async validateToken(token: string): Promise<ExternalTokenResult> {
    const tokens = await this.prisma.$queryRawUnsafe(
      `
      SELECT * FROM "ExternalToken" WHERE token = $1
    `,
      token,
    );

    // || tokens.length === 0
    if (!tokens) {
      throw new NotFoundException('Token không tồn tại hoặc đã hết hạn');
    }

    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    const externalToken = tokens[0];
    const externalTokenId: string = externalToken.id;
    const externalTokenVal: string = externalToken.token;
    const externalTokenType: TokenType = externalToken.type;
    const externalTokenRefId: string = externalToken.referenceId;
    const externalTokenEmail: string = externalToken.targetEmail;
    const externalTokenExpiry: Date = externalToken.expiresAt;
    const externalTokenUsedAt: Date | null = externalToken.usedAt;
    /* eslint-enable @typescript-eslint/no-unsafe-assignment */

    // Check if token is expired
    if (new Date() > new Date(externalTokenExpiry)) {
      throw new BadRequestException('Token đã hết hạn');
    }

    // Check if token is already used
    if (externalTokenUsedAt) {
      throw new BadRequestException('Token đã được sử dụng');
    }

    return {
      id: externalTokenId,
      token: externalTokenVal,
      type: externalTokenType,
      referenceId: externalTokenRefId,
      targetEmail: externalTokenEmail,
      expiresAt: externalTokenExpiry,
      link: this.generateLink(externalTokenType, externalTokenVal),
    };
  }

  /**
   * Mark token as used
   */
  async markTokenAsUsed(token: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `
      UPDATE "ExternalToken" SET "usedAt" = NOW() WHERE token = $1
    `,
      token,
    );
  }

  /**
   * Revoke/delete token
   */
  async revokeToken(token: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `
      DELETE FROM "ExternalToken" WHERE token = $1
    `,
      token,
    );
  }

  /**
   * Get all active tokens by reference
   */
  async getActiveTokensByReference(
    referenceId: string,
    type?: TokenType,
  ): Promise<ExternalTokenResult[]> {
    const tokens: any[] = await this.prisma.$queryRawUnsafe(
      `
      SELECT * FROM "ExternalToken"
      WHERE "referenceId" = $1
        AND "expiresAt" > NOW()
        AND "usedAt" IS NULL
        ${type ? `AND type = '${type}'` : ''}
    `,
      referenceId,
    );

    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    return tokens.map((t) => ({
      id: t.id,
      token: t.token,
      type: t.type,
      referenceId: t.referenceId,
      targetEmail: t.targetEmail,
      expiresAt: t.expiresAt,
      link: this.generateLink(t.type, t.token),
    }));
    /* eslint-enable @typescript-eslint/no-unsafe-assignment */
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

    return result;
  }
}
