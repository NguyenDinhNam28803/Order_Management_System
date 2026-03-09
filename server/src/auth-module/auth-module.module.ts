import { Module } from '@nestjs/common';
import { AuthModuleService } from './auth-module.service';
import { AuthModuleController } from './auth-module.controller';
import { AuthModuleRepository } from './auth-module.repository';
import { HashPasswordService } from '../hash-password/hash-password.service';

@Module({
  controllers: [AuthModuleController],
  providers: [AuthModuleService, AuthModuleRepository, HashPasswordService],
  exports: [AuthModuleService],
})
export class AuthModuleModule {}
