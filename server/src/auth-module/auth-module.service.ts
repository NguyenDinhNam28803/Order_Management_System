import { Injectable } from '@nestjs/common';
import { AuthModuleRepository } from './auth-module.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthModuleService {
  constructor(private readonly authModuleRepository: AuthModuleRepository) {}

  async login(loginDto: LoginDto) {
    return this.authModuleRepository.login(loginDto);
  }

  async register(registerDto: RegisterDto) {
    return this.authModuleRepository.register(registerDto);
  }

  async refreshToken(refreshToken: string) {
    return this.authModuleRepository.refreshToken(refreshToken);
  }

  async validateToken(token: string) {
    return this.authModuleRepository.validateToken(token);
  }

  logout() {
    return { message: 'Đã đăng xuất thành công' };
  }
}
