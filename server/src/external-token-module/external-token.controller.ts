import { Controller, Post, Get, Delete, Body, Param, Query } from '@nestjs/common';
import type { ExternalTokenService, CreateExternalTokenDto, TokenType } from './external-token.service';
import { ExternalTokenService as ExternalTokenServiceImpl } from './external-token.service';

@Controller('external-token')
export class ExternalTokenController {
  constructor(private readonly externalTokenService: ExternalTokenServiceImpl) {}

  @Post('create')
  async createToken(@Body() dto: CreateExternalTokenDto) {
    return this.externalTokenService.createToken(dto);
  }

  @Get('validate/:token')
  async validateToken(@Param('token') token: string) {
    return this.externalTokenService.validateToken(token);
  }

  @Post('use/:token')
  async markTokenAsUsed(@Param('token') token: string) {
    await this.externalTokenService.markTokenAsUsed(token);
    return { success: true };
  }

  @Delete('revoke/:token')
  async revokeToken(@Param('token') token: string) {
    await this.externalTokenService.revokeToken(token);
    return { success: true };
  }

  @Get('by-reference/:referenceId')
  async getActiveTokensByReference(
    @Param('referenceId') referenceId: string,
    @Query('type') type?: TokenType,
  ) {
    return this.externalTokenService.getActiveTokensByReference(referenceId, type);
  }
}
