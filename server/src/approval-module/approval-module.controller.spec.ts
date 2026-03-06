import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalModuleController } from './approval-module.controller';
import { ApprovalModuleService } from './approval-module.service';

describe('ApprovalModuleController', () => {
  let controller: ApprovalModuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApprovalModuleController],
      providers: [ApprovalModuleService],
    }).compile();

    controller = module.get<ApprovalModuleController>(ApprovalModuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
