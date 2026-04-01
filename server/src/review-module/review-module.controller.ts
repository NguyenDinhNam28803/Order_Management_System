import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewModuleService } from './review-module.service';
import {
  CreateBuyerRatingDto,
  CreateSupplierManualReviewDto,
} from './dto/review.dto';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Review & Rating Management')
@ApiBearerAuth('JWT-auth')
@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewModuleController {
  constructor(private readonly reviewModuleService: ReviewModuleService) {}

  /**
   * Nhà cung cấp đánh giá người mua
   */
  @Post('buyer-rating')
  @ApiOperation({ summary: 'Nhà cung cấp đánh giá người mua' })
  createBuyerRating(
    @Body() dto: CreateBuyerRatingDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.reviewModuleService.createBuyerRating(
      dto,
      req.user.sub,
      req.user.orgId,
    );
  }

  /**
   * Người mua đánh giá thủ công nhà cung cấp
   */
  @Post('supplier-review')
  @ApiOperation({ summary: 'Người mua đánh giá thủ công nhà cung cấp' })
  createSupplierManualReview(
    @Body() dto: CreateSupplierManualReviewDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.reviewModuleService.createSupplierManualReview(
      dto,
      req.user.sub,
    );
  }

  /**
   * Lấy danh sách đánh giá của nhà cung cấp
   */
  @Get('supplier/:supplierId')
  @ApiOperation({ summary: 'Lấy danh sách đánh giá của nhà cung cấp' })
  getSupplierReviews(@Param('supplierId') supplierId: string) {
    return this.reviewModuleService.getSupplierReviews(supplierId);
  }

  /**
   * Lấy danh sách đánh giá của người mua (tổ chức hiện tại)
   */
  @Get('buyer-ratings')
  @ApiOperation({
    summary: 'Lấy danh sách đánh giá của người mua (tổ chức hiện tại)',
  })
  getBuyerRatings(@Request() req: { user: JwtPayload }) {
    return this.reviewModuleService.getBuyerRatings(req.user.orgId);
  }
}
