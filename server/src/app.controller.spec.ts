import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  const mockPrisma = { $queryRaw: jest.fn() };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    jest.clearAllMocks();
  });

  describe('getHello', () => {
    it('trả về chuỗi chào mừng từ AppService', () => {
      expect(appController.getHello()).toContain('API cho hệ thống quản lý');
    });
  });

  describe('health', () => {
    it('trả về status "ok" khi truy vấn database thành công', async () => {
      mockPrisma.$queryRaw.mockResolvedValueOnce([{ '?column?': 1 }]);
      const res = await appController.health();
      expect(res.status).toBe('ok');
      expect(res.services.database).toBe('ok');
      expect(typeof res.uptime).toBe('number');
      expect(res.timestamp).toBeDefined();
    });

    it('trả về status "degraded" khi database lỗi', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('DB down'));
      const res = await appController.health();
      expect(res.status).toBe('degraded');
      expect(res.services.database).toBe('error');
    });
  });
});
