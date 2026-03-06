import { Injectable } from '@nestjs/common';
import { CreatePomoduleDto } from './dto/create-pomodule.dto';
import { UpdatePomoduleDto } from './dto/update-pomodule.dto';

@Injectable()
export class PomoduleService {
  create(createPomoduleDto: CreatePomoduleDto) {
    return 'This action adds a new pomodule';
  }

  findAll() {
    return `This action returns all pomodule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pomodule`;
  }

  update(id: number, updatePomoduleDto: UpdatePomoduleDto) {
    return `This action updates a #${id} pomodule`;
  }

  remove(id: number) {
    return `This action removes a #${id} pomodule`;
  }
}
