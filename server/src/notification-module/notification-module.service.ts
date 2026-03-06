import { Injectable } from '@nestjs/common';
import { CreateNotificationModuleDto } from './dto/create-notification-module.dto';
import { UpdateNotificationModuleDto } from './dto/update-notification-module.dto';

@Injectable()
export class NotificationModuleService {
  create(createNotificationModuleDto: CreateNotificationModuleDto) {
    return 'This action adds a new notificationModule';
  }

  findAll() {
    return `This action returns all notificationModule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} notificationModule`;
  }

  update(id: number, updateNotificationModuleDto: UpdateNotificationModuleDto) {
    return `This action updates a #${id} notificationModule`;
  }

  remove(id: number) {
    return `This action removes a #${id} notificationModule`;
  }
}
