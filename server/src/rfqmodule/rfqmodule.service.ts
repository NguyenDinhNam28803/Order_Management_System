import { Injectable } from '@nestjs/common';
import { CreateRfqmoduleDto } from './dto/create-rfqmodule.dto';
import { UpdateRfqmoduleDto } from './dto/update-rfqmodule.dto';

@Injectable()
export class RfqmoduleService {
  create(createRfqmoduleDto: CreateRfqmoduleDto) {
    return 'This action adds a new rfqmodule';
  }

  findAll() {
    return `This action returns all rfqmodule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} rfqmodule`;
  }

  update(id: number, updateRfqmoduleDto: UpdateRfqmoduleDto) {
    return `This action updates a #${id} rfqmodule`;
  }

  remove(id: number) {
    return `This action removes a #${id} rfqmodule`;
  }
}
