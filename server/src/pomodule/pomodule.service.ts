import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePoDto } from './dto/create-po.dto';
import { PoRepository } from './po.repository';

@Injectable()
export class PomoduleService {
  constructor(private readonly repository: PoRepository) {}

  async create(createPoDto: CreatePoDto, user: any) {
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    return this.repository.create(createPoDto, user.sub, user.orgId, poNumber);
  }

  async findAll(user: any) {
    return this.repository.findAll(user.orgId);
  }

  async findOne(id: string) {
    const po = await this.repository.findOne(id);
    if (!po) {
      throw new NotFoundException(`PO with ID ${id} not found`);
    }
    return po;
  }
}
