import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AdminModuleService } from './admin-module.service';

@Controller('admin-module')
export class AdminModuleController {
  constructor(private readonly adminModuleService: AdminModuleService) {}

  @Post()
  create() {
    return this.adminModuleService.create();
  }

  @Get()
  findAll() {
    return this.adminModuleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminModuleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.adminModuleService.update(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminModuleService.remove(+id);
  }
}
