import { Test, TestingModule } from '@nestjs/testing';
import { DisputeModuleController } from './dispute-module.controller';
import { DisputeModuleService } from './dispute-module.service';

describe('DisputeModuleController', () => {
  let controller: DisputeModuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DisputeModuleController],
      providers: [DisputeModuleService],
    }).compile();

    controller = module.get<DisputeModuleController>(DisputeModuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
