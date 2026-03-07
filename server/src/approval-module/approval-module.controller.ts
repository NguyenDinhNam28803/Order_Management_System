import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApprovalModuleService } from './approval-module.service';

@Controller('approval-module')
export class ApprovalModuleController {
  constructor(private readonly approvalModuleService: ApprovalModuleService) {}

  @Post()
  create() {
    return this.approvalModuleService.create();
  }

  @Get()
  findAll() {
    return this.approvalModuleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.approvalModuleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string) {
    return this.approvalModuleService.update(+id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.approvalModuleService.remove(+id);
  }
}
