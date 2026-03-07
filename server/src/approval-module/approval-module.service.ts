import { Injectable } from '@nestjs/common';

@Injectable()
export class ApprovalModuleService {
  create() {
    return 'This action adds a new approvalModule';
  }

  findAll() {
    return `This action returns all approvalModule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} approvalModule`;
  }

  update(id: number) {
    return `This action updates a #${id} approvalModule`;
  }

  remove(id: number) {
    return `This action removes a #${id} approvalModule`;
  }
}
