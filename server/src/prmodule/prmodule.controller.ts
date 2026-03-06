import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PrmoduleService } from './prmodule.service';
import { CreatePrmoduleDto } from './dto/create-prmodule.dto';
import { UpdatePrmoduleDto } from './dto/update-prmodule.dto';

@Controller('prmodule')
export class PrmoduleController {
  constructor(private readonly prmoduleService: PrmoduleService) {}

  @Post()
  create(@Body() createPrmoduleDto: CreatePrmoduleDto) {
    return this.prmoduleService.create(createPrmoduleDto);
  }

  @Get()
  findAll() {
    return this.prmoduleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.prmoduleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePrmoduleDto: UpdatePrmoduleDto) {
    return this.prmoduleService.update(+id, updatePrmoduleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.prmoduleService.remove(+id);
  }
}
