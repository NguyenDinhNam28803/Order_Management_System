import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ReviewModuleService } from './review-module.service';
import { CreateReviewModuleDto } from './dto/create-review-module.dto';
import { UpdateReviewModuleDto } from './dto/update-review-module.dto';

@Controller('review-module')
export class ReviewModuleController {
  constructor(private readonly reviewModuleService: ReviewModuleService) {}

  /**
   * Tạo một đánh giá hoặc nhận xét mới
   * @param createReviewModuleDto Dữ liệu tạo đánh giá
   * @returns Đánh giá vừa tạo
   */
  @Post()
  create(@Body() createReviewModuleDto: CreateReviewModuleDto) {
    return this.reviewModuleService.create(createReviewModuleDto);
  }

  /**
   * Lấy danh sách tất cả các đánh giá hiện có
   * @returns Danh sách đánh giá
   */
  @Get()
  findAll() {
    return this.reviewModuleService.findAll();
  }

  /**
   * Lấy thông tin chi tiết của một đánh giá cụ thể theo ID
   * @param id ID của đánh giá
   * @returns Chi tiết đánh giá
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewModuleService.findOne(+id);
  }

  /**
   * Cập nhật nội dung hoặc trạng thái của một đánh giá theo ID
   * @param id ID của đánh giá
   * @param updateReviewModuleDto Dữ liệu cập nhật
   * @returns Đánh giá sau khi cập nhật
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateReviewModuleDto: UpdateReviewModuleDto,
  ) {
    return this.reviewModuleService.update(+id, updateReviewModuleDto);
  }

  /**
   * Xóa một đánh giá khỏi hệ thống theo ID
   * @param id ID của đánh giá cần xóa
   * @returns Kết quả xóa
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewModuleService.remove(+id);
  }
}
