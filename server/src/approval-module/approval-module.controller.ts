import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApprovalModuleService } from './approval-module.service';
import { CreateApprovalModuleDto } from './dto/create-approval-module.dto';
import { UpdateApprovalModuleDto } from './dto/update-approval-module.dto';

@Controller('approval-module')
export class ApprovalModuleController {
  constructor(private readonly approvalModuleService: ApprovalModuleService) {}

  @Post()
  create(@Body() createApprovalModuleDto: CreateApprovalModuleDto) {
    return this.approvalModuleService.create(createApprovalModuleDto);
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
  update(
    @Param('id') id: string,
    @Body() updateApprovalModuleDto: UpdateApprovalModuleDto,
  ) {
    return this.approvalModuleService.update(+id, updateApprovalModuleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.approvalModuleService.remove(+id);
  }
}
