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
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Review Management')
@Controller('reviews')
export class ReviewModuleController {
  constructor(private readonly reviewModuleService: ReviewModuleService) {}

  /**
   * Tạo một đánh giá hoặc nhận xét mới
   * @param createReviewModuleDto Dữ liệu tạo đánh giá
   * @returns Đánh giá vừa tạo
   */
  @Post()
  @ApiOperation({ summary: 'Tạo đánh giá mới' })
  create(@Body() createReviewModuleDto: CreateReviewModuleDto) {
    return this.reviewModuleService.create(createReviewModuleDto);
  }

  /**
   * Lấy danh sách tất cả các đánh giá hiện có
   * @returns Danh sách đánh giá
   */
  @Get()
  @ApiOperation({ summary: 'Lấy tất cả đánh giá' })
  findAll() {
    return this.reviewModuleService.findAll();
  }

  /**
   * Lấy thông tin chi tiết của một đánh giá cụ thể theo ID
   * @param id ID của đánh giá
   * @returns Chi tiết đánh giá
   */
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết đánh giá theo ID' })
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
  @ApiOperation({ summary: 'Cập nhật đánh giá theo ID' })
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
  @ApiOperation({ summary: 'Xóa đánh giá theo ID' })
  remove(@Param('id') id: string) {
    return this.reviewModuleService.remove(+id);
  }
}
