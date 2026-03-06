import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { NotificationModuleService } from './notification-module.service';
import { CreateNotificationModuleDto } from './dto/create-notification-module.dto';
import { UpdateNotificationModuleDto } from './dto/update-notification-module.dto';

@Controller('notification-module')
export class NotificationModuleController {
  constructor(private readonly notificationModuleService: NotificationModuleService) {}

  @Post()
  create(@Body() createNotificationModuleDto: CreateNotificationModuleDto) {
    return this.notificationModuleService.create(createNotificationModuleDto);
  }

  @Get()
  findAll() {
    return this.notificationModuleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationModuleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNotificationModuleDto: UpdateNotificationModuleDto) {
    return this.notificationModuleService.update(+id, updateNotificationModuleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationModuleService.remove(+id);
  }
}
