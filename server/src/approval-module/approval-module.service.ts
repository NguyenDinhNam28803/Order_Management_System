import { Injectable } from '@nestjs/common';
import { CreateApprovalModuleDto } from './dto/create-approval-module.dto';
import { UpdateApprovalModuleDto } from './dto/update-approval-module.dto';

@Injectable()
export class ApprovalModuleService {
  create(createApprovalModuleDto: CreateApprovalModuleDto) {
    return 'This action adds a new approvalModule';
  }

  findAll() {
    return `This action returns all approvalModule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} approvalModule`;
  }

  update(id: number, updateApprovalModuleDto: UpdateApprovalModuleDto) {
    return `This action updates a #${id} approvalModule`;
  }

  remove(id: number) {
    return `This action removes a #${id} approvalModule`;
  }
}
