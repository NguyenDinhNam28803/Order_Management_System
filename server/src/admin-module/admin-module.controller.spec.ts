import { Test, TestingModule } from '@nestjs/testing';
import { AdminModuleController } from './admin-module.controller';
import { AdminModuleService } from './admin-module.service';

describe('AdminModuleController', () => {
  let controller: AdminModuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminModuleController],
      providers: [AdminModuleService],
    }).compile();

    controller = module.get<AdminModuleController>(AdminModuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
