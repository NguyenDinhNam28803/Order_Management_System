import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModuleService } from './user-module.service';
import { UserModuleController } from './user-module.controller';
import { UserRepository } from './user.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModuleModule } from '../notification-module/notification-module.module';

@Module({
  imports: [PrismaModule, NotificationModuleModule, ConfigModule],
  controllers: [UserModuleController],
  providers: [UserModuleService, UserRepository],
  exports: [UserModuleService, UserRepository],
})
export class UserModuleModule {}
