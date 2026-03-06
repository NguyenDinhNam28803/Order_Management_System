import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DisputeModuleService } from './dispute-module.service';
import { CreateDisputeModuleDto } from './dto/create-dispute-module.dto';
import { UpdateDisputeModuleDto } from './dto/update-dispute-module.dto';

@Controller('dispute-module')
export class DisputeModuleController {
  constructor(private readonly disputeModuleService: DisputeModuleService) {}

  @Post()
  create(@Body() createDisputeModuleDto: CreateDisputeModuleDto) {
    return this.disputeModuleService.create(createDisputeModuleDto);
  }

  @Get()
  findAll() {
    return this.disputeModuleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.disputeModuleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDisputeModuleDto: UpdateDisputeModuleDto) {
    return this.disputeModuleService.update(+id, updateDisputeModuleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.disputeModuleService.remove(+id);
  }
}
