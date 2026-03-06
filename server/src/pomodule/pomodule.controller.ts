import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PomoduleService } from './pomodule.service';
import { CreatePomoduleDto } from './dto/create-pomodule.dto';
import { UpdatePomoduleDto } from './dto/update-pomodule.dto';

@Controller('pomodule')
export class PomoduleController {
  constructor(private readonly pomoduleService: PomoduleService) {}

  @Post()
  create(@Body() createPomoduleDto: CreatePomoduleDto) {
    return this.pomoduleService.create(createPomoduleDto);
  }

  @Get()
  findAll() {
    return this.pomoduleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pomoduleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePomoduleDto: UpdatePomoduleDto) {
    return this.pomoduleService.update(+id, updatePomoduleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pomoduleService.remove(+id);
  }
}
