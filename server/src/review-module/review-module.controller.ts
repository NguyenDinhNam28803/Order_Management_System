import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ReviewModuleService } from './review-module.service';
import { CreateReviewModuleDto } from './dto/create-review-module.dto';
import { UpdateReviewModuleDto } from './dto/update-review-module.dto';

@Controller('review-module')
export class ReviewModuleController {
  constructor(private readonly reviewModuleService: ReviewModuleService) {}

  @Post()
  create(@Body() createReviewModuleDto: CreateReviewModuleDto) {
    return this.reviewModuleService.create(createReviewModuleDto);
  }

  @Get()
  findAll() {
    return this.reviewModuleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewModuleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReviewModuleDto: UpdateReviewModuleDto) {
    return this.reviewModuleService.update(+id, updateReviewModuleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewModuleService.remove(+id);
  }
}
