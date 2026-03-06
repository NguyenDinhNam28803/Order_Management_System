import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RfqmoduleService } from './rfqmodule.service';
import { CreateRfqmoduleDto } from './dto/create-rfqmodule.dto';
import { UpdateRfqmoduleDto } from './dto/update-rfqmodule.dto';

@Controller('rfqmodule')
export class RfqmoduleController {
  constructor(private readonly rfqmoduleService: RfqmoduleService) {}

  @Post()
  create(@Body() createRfqmoduleDto: CreateRfqmoduleDto) {
    return this.rfqmoduleService.create(createRfqmoduleDto);
  }

  @Get()
  findAll() {
    return this.rfqmoduleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rfqmoduleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRfqmoduleDto: UpdateRfqmoduleDto) {
    return this.rfqmoduleService.update(+id, updateRfqmoduleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rfqmoduleService.remove(+id);
  }
}
