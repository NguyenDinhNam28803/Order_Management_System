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

  logout() {
    return { message: 'Đã đăng xuất thành công' };
  }
}
