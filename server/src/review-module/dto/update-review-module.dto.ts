import { PartialType } from '@nestjs/mapped-types';
import { CreateReviewModuleDto } from './create-review-module.dto';

export class UpdateReviewModuleDto extends PartialType(CreateReviewModuleDto) {}
