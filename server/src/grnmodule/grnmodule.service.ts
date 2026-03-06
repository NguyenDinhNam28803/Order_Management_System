import { Injectable } from '@nestjs/common';
import { CreateGrnmoduleDto } from './dto/create-grnmodule.dto';
import { UpdateGrnmoduleDto } from './dto/update-grnmodule.dto';

@Injectable()
export class GrnmoduleService {
  create(createGrnmoduleDto: CreateGrnmoduleDto) {
    return 'This action adds a new grnmodule';
  }

  findAll() {
    return `This action returns all grnmodule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} grnmodule`;
  }

  update(id: number, updateGrnmoduleDto: UpdateGrnmoduleDto) {
    return `This action updates a #${id} grnmodule`;
  }

  remove(id: number) {
    return `This action removes a #${id} grnmodule`;
  }
}
