import { Module } from '@nestjs/common';
import { UserModuleService } from './user-module.service';
import { UserModuleController } from './user-module.controller';
import { UserRepository } from './user.repository';

@Module({
  controllers: [UserModuleController],
  providers: [UserModuleService, UserRepository],
})
export class UserModuleModule {}
