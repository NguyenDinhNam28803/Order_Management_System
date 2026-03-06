import { Injectable } from '@nestjs/common';
import { CreateAdminModuleDto } from './dto/create-admin-module.dto';
import { UpdateAdminModuleDto } from './dto/update-admin-module.dto';

@Injectable()
export class AdminModuleService {
  create(createAdminModuleDto: CreateAdminModuleDto) {
    return 'This action adds a new adminModule';
  }

  findAll() {
    return `This action returns all adminModule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} adminModule`;
  }

  update(id: number, updateAdminModuleDto: UpdateAdminModuleDto) {
    return `This action updates a #${id} adminModule`;
  }

  remove(id: number) {
    return `This action removes a #${id} adminModule`;
  }
}
