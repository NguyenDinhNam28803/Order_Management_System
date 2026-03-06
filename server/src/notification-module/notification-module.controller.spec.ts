import { Test, TestingModule } from '@nestjs/testing';
import { NotificationModuleController } from './notification-module.controller';
import { NotificationModuleService } from './notification-module.service';

describe('NotificationModuleController', () => {
  let controller: NotificationModuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationModuleController],
      providers: [NotificationModuleService],
    }).compile();

    controller = module.get<NotificationModuleController>(NotificationModuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
