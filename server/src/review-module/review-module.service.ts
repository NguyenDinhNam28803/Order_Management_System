import { Injectable } from '@nestjs/common';
import { CreateReviewModuleDto } from './dto/create-review-module.dto';
import { UpdateReviewModuleDto } from './dto/update-review-module.dto';

@Injectable()
export class ReviewModuleService {
  create(createReviewModuleDto: CreateReviewModuleDto) {
    return 'This action adds a new reviewModule';
  }

  findAll() {
    return `This action returns all reviewModule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} reviewModule`;
  }

  update(id: number, updateReviewModuleDto: UpdateReviewModuleDto) {
    return `This action updates a #${id} reviewModule`;
  }

  remove(id: number) {
    return `This action removes a #${id} reviewModule`;
  }
}
