import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModuleService } from './auth-module.service';
import { AuthModuleController } from './auth-module.controller';
import { AuthModuleRepository } from './auth-module.repository';
import { HashPasswordService } from '../hash-password/hash-password.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthModuleController],
  providers: [AuthModuleService, AuthModuleRepository, HashPasswordService],
  exports: [AuthModuleService],
})
export class AuthModuleModule {}
