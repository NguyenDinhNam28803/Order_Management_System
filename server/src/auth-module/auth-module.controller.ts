import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthModuleService } from './auth-module.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ApiBearerAuth } from '@nestjs/swagger/dist/decorators/api-bearer.decorator';
import { ValidateTokenDto } from './dto/validate-token.dto';
import type { Request } from 'express';
import { ApiOperation } from '@nestjs/swagger/dist/decorators/api-operation.decorator';

interface RequestWithUser extends Request {
  user: { sub: string };
}

@Controller('auth-module')
export class AuthModuleController {
  constructor(private readonly authModuleService: AuthModuleService) {}

  /**
   * Đăng nhập vào hệ thống
   * @param loginDto Thông tin đăng nhập (email, password)
   * @returns Token truy cập và thông tin người dùng
   */
  @Post('login')
  @ApiOperation({
    summary: 'Đăng nhập',
    description: 'Đăng nhập vào hệ thống với thông tin người dùng',
  })
  async login(@Body() loginDto: LoginDto) {
    return await this.authModuleService.login(loginDto);
  }

  /**
   * Đăng ký tài khoản người dùng mới
   * @param registerDto Thông tin đăng ký
   * @returns Thông tin người dùng vừa được tạo
   */
  @Post('register')
  @ApiOperation({
    summary: 'Đăng ký',
    description: 'Đăng ký tài khoản mới trong hệ thống',
  })
  async register(@Body() registerDto: RegisterDto) {
    return await this.authModuleService.register(registerDto);
  }

  /**
   * Làm mới token truy cập khi đã hết hạn
   * @param refreshToken Dữ liệu chứa refresh token
   * @returns Token mới
   */
  @Post('refresh-token')
  @ApiOperation({
    summary: 'Làm mới token',
    description: 'Làm mới token JWT khi token cũ sắp hết hạn',
  })
  @ApiBearerAuth('JWT-auth')
  async refreshToken(@Body() refreshToken: ValidateTokenDto) {
    return await this.authModuleService.refreshToken(refreshToken.token);
  }

  /**
   * Kiểm tra tính hợp lệ của token hiện tại
   * @param req Yêu cầu HTTP chứa header Authorization
   * @returns Trạng thái hợp lệ của token
   */
  @Post('validate-token')
  @ApiOperation({
    summary: 'Xác thực token',
    description: 'Kiểm tra tính hợp lệ của token JWT',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async validateToken(@Req() req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return { valid: false, message: 'No authorization header' };
    }
    const token = authHeader.split(' ')[1];
    return await this.authModuleService.validateToken(token);
  }

  /**
   * Đăng xuất người dùng khỏi hệ thống
   * @param req Yêu cầu HTTP chứa thông tin người dùng đã xác thực
   * @returns Thông báo kết quả đăng xuất
   */
  @Post('logout')
  @ApiOperation({
    summary: 'Đăng xuất',
    description: 'Đăng xuất khỏi hệ thống và vô hiệu hóa token',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: RequestWithUser) {
    return await this.authModuleService.logout(req.user.sub);
  }
}
