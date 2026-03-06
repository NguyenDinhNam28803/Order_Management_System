import { Injectable } from '@nestjs/common';
import { CreateDisputeModuleDto } from './dto/create-dispute-module.dto';
import { UpdateDisputeModuleDto } from './dto/update-dispute-module.dto';

@Injectable()
export class DisputeModuleService {
  create(createDisputeModuleDto: CreateDisputeModuleDto) {
    return 'This action adds a new disputeModule';
  }

  findAll() {
    return `This action returns all disputeModule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} disputeModule`;
  }

  update(id: number, updateDisputeModuleDto: UpdateDisputeModuleDto) {
    return `This action updates a #${id} disputeModule`;
  }

  remove(id: number) {
    return `This action removes a #${id} disputeModule`;
  }
}
