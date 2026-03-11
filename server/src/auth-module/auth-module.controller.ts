import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthModuleService } from './auth-module.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiBearerAuth } from '@nestjs/swagger/dist/decorators/api-bearer.decorator';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { sub: string };
}

@Controller('auth-module')
export class AuthModuleController {
  constructor(private readonly authModuleService: AuthModuleService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.authModuleService.login(loginDto);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.authModuleService.register(registerDto);
  }

  @Post('refresh-token')
  @ApiBearerAuth('JWT-auth')
  async refreshToken(@Body() refreshToken: ValidateTokenDto) {
    return await this.authModuleService.refreshToken(refreshToken.token);
  }

  @Post('validate-token')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async validateToken(@Body() token: ValidateTokenDto) {
    return await this.authModuleService.validateToken(token.token);
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: RequestWithUser) {
    return await this.authModuleService.logout(req.user.sub);
  }
}
