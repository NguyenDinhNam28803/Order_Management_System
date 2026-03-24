import { Test, TestingModule } from '@nestjs/testing';
import { NotificationModuleService } from './notification-module.service';

describe('NotificationModuleService', () => {
  let service: NotificationModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationModuleService],
    }).compile();

    service = module.get<NotificationModuleService>(NotificationModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
