import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Đây là API cho hệ thống quản lý doanh nghiệp của bạn! Hãy khám phá các endpoint để quản lý quy trình duyệt, đơn đặt hàng, và nhiều hơn nữa.';
  }
}
