import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Chuyển mọi Prisma Decimal trong response thành `number`.
 *
 * Vì sao cần: Decimal là class instance với các thuộc tính nội bộ { s, e, d }.
 * BigIntInterceptor build lại object thuần bằng `for...in`, vô tình bóc Decimal
 * thành object thô `{ s, e, d }` rồi gửi xuống client — gây lỗi render React
 * ("Objects are not valid as a React child") hoặc `NaN` khi client gọi
 * `Number(...)` trên object đó.
 *
 * Interceptor này được đăng ký SAU BigIntInterceptor trong
 * `useGlobalInterceptors` để chạy ở lớp trong cùng — tức map() của nó xử lý dữ
 * liệu thô từ controller TRƯỚC khi BigIntInterceptor build lại object. Nhờ vậy
 * Decimal đã thành `number` trước khi bị bóc tách.
 */
@Injectable()
export class DecimalInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => this.serialize(data)));
  }

  private serialize(data: unknown): unknown {
    if (data === null || data === undefined) return data;

    if (this.isDecimal(data)) {
      return (data as Prisma.Decimal).toNumber();
    }

    // Giữ nguyên các kiểu không nên duyệt sâu
    if (data instanceof Date) return data;
    if (Buffer.isBuffer(data)) return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.serialize(item));
    }

    if (typeof data === 'object') {
      const result: Record<string, unknown> = {};
      for (const key in data as Record<string, unknown>) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          result[key] = this.serialize(
            (data as Record<string, unknown>)[key],
          );
        }
      }
      return result;
    }

    return data;
  }

  private isDecimal(value: unknown): boolean {
    if (Prisma.Decimal.isDecimal(value)) return true;
    // Fallback phòng trường hợp instance đến từ một bản copy khác của thư viện:
    // nhận diện theo cấu trúc { s, e, d } kèm method toNumber().
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as { toNumber?: unknown }).toNumber === 'function' &&
      's' in value &&
      'e' in value &&
      'd' in value
    );
  }
}
