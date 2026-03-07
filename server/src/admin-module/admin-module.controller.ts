import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AdminModuleService } from './admin-module.service';
import { CreateAdminModuleDto } from './dto/create-admin-module.dto';
import { UpdateAdminModuleDto } from './dto/update-admin-module.dto';

@Controller('admin-module')
export class AdminModuleController {
  constructor(private readonly adminModuleService: AdminModuleService) {}

  @Post()
  create(@Body() createAdminModuleDto: CreateAdminModuleDto) {
    return this.adminModuleService.create(createAdminModuleDto);
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
  update(
    @Param('id') id: string,
    @Body() updateAdminModuleDto: UpdateAdminModuleDto,
  ) {
    return this.adminModuleService.update(+id, updateAdminModuleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminModuleService.remove(+id);
  }
}
