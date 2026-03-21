import { Module } from '@nestjs/common';
import { UserModuleService } from './user-module.service';
import { UserModuleController } from './user-module.controller';
import { UserRepository } from './user.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '@nestjs/cache-manager';
import { NotificationModuleModule } from '../notification-module/notification-module.module';

@Module({
  imports: [PrismaModule, CacheModule.register(), NotificationModuleModule],
  controllers: [UserModuleController],
  providers: [UserModuleService, UserRepository],
  exports: [UserModuleService, UserRepository],
})
export class UserModuleModule {}
