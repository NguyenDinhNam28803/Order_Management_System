import { Controller, Post, Body } from '@nestjs/common';
import { AuthModuleService } from './auth-module.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

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

  @Post('logout')
  logout() {
    return this.authModuleService.logout();
  }
}
