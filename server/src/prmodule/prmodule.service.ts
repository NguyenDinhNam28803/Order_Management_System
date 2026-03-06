import { Injectable } from '@nestjs/common';
import { CreatePrmoduleDto } from './dto/create-prmodule.dto';
import { UpdatePrmoduleDto } from './dto/update-prmodule.dto';

@Injectable()
export class PrmoduleService {
  create(createPrmoduleDto: CreatePrmoduleDto) {
    return 'This action adds a new prmodule';
  }

  findAll() {
    return `This action returns all prmodule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} prmodule`;
  }

  update(id: number, updatePrmoduleDto: UpdatePrmoduleDto) {
    return `This action updates a #${id} prmodule`;
  }

  remove(id: number) {
    return `This action removes a #${id} prmodule`;
  }
}
