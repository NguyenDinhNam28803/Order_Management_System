import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { RfqRepository } from './rfq.repository';

@Injectable()
export class RfqmoduleService {
  constructor(private readonly repository: RfqRepository) {}

  async create(createRfqDto: CreateRfqDto, user: any) {
    const rfqNumber = `RFQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    return this.repository.create(
      createRfqDto,
      user.sub,
      user.orgId,
      rfqNumber,
    );
  }

  async findAll(user: any) {
    return this.repository.findAll(user.orgId);
  }

  async findOne(id: string) {
    const rfq = await this.repository.findOne(id);
    if (!rfq) {
      throw new NotFoundException(`RFQ with ID ${id} not found`);
    }
    return rfq;
  }
}
