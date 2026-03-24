import { Test, TestingModule } from '@nestjs/testing';
import { ApprovalModuleService } from './approval-module.service';

describe('ApprovalModuleService', () => {
  let service: ApprovalModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApprovalModuleService],
    }).compile();

    service = module.get<ApprovalModuleService>(ApprovalModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
