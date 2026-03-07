import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminModuleService {
  create() {
    return 'This action adds a new adminModule';
  }

  findAll() {
    return `This action returns all adminModule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} adminModule`;
  }

  update(id: number) {
    return `This action updates a #${id} adminModule`;
  }

  remove(id: number) {
    return `This action removes a #${id} adminModule`;
  }
}
