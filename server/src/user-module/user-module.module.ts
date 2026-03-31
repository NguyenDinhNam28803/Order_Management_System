import { Module } from '@nestjs/common';
import { UserModuleService } from './user-module.service';
import { UserModuleController } from './user-module.controller';
import { UserRepository } from './user.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModuleModule } from '../notification-module/notification-module.module';

@Module({
  imports: [PrismaModule, NotificationModuleModule],
  controllers: [UserModuleController],
  providers: [UserModuleService, UserRepository],
  exports: [UserModuleService, UserRepository],
})
export class UserModuleModule {}
