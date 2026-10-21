import 'reflect-metadata';
import { EmailRagService } from './email-rag.service';

/**
 * Key này do @nestjs/schedule đặt qua SetMetadata bên trong decorator @Cron
 * (node_modules/@nestjs/schedule/dist/schedule.constants.js:
 *  SCHEDULE_CRON_OPTIONS = 'SCHEDULE_CRON_OPTIONS').
 * Hardcode thay vì import từ dist/ để không phụ thuộc vào đường dẫn nội bộ của package.
 */
const SCHEDULE_CRON_OPTIONS = 'SCHEDULE_CRON_OPTIONS';

describe('EmailRagService', () => {
  it('không đăng ký cron tự động cho autoSyncEmails', () => {
    // Chốt chặn: method phải còn để gọi tay qua POST /rag/emails/ingest.
    expect(typeof EmailRagService.prototype.autoSyncEmails).toBe('function');

    const cronOptions: unknown = Reflect.getMetadata(
      SCHEDULE_CRON_OPTIONS,
      // Cố ý lấy method ở dạng unbound: @Cron gắn metadata lên chính function
      // object, và ở đây ta chỉ đọc metadata chứ không bao giờ gọi nó.
      // eslint-disable-next-line @typescript-eslint/unbound-method
      EmailRagService.prototype.autoSyncEmails,
    );

    expect(cronOptions).toBeUndefined();
  });
});
