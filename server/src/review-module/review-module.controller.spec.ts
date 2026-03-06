import { Test, TestingModule } from '@nestjs/testing';
import { ReviewModuleController } from './review-module.controller';
import { ReviewModuleService } from './review-module.service';

describe('ReviewModuleController', () => {
  let controller: ReviewModuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReviewModuleController],
      providers: [ReviewModuleService],
    }).compile();

    controller = module.get<ReviewModuleController>(ReviewModuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
