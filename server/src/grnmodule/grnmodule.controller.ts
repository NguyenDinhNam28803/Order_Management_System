import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { GrnmoduleService } from './grnmodule.service';
import { CreateGrnmoduleDto } from './dto/create-grnmodule.dto';
import { UpdateGrnmoduleDto } from './dto/update-grnmodule.dto';

@Controller('grnmodule')
export class GrnmoduleController {
  constructor(private readonly grnmoduleService: GrnmoduleService) {}

  @Post()
  create(@Body() createGrnmoduleDto: CreateGrnmoduleDto) {
    return this.grnmoduleService.create(createGrnmoduleDto);
  }

  @Get()
  findAll() {
    return this.grnmoduleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.grnmoduleService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateGrnmoduleDto: UpdateGrnmoduleDto,
  ) {
    return this.grnmoduleService.update(+id, updateGrnmoduleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.grnmoduleService.remove(+id);
  }
}
