import { Test, TestingModule } from '@nestjs/testing';
import { ReviewModuleService } from './review-module.service';

describe('ReviewModuleService', () => {
  let service: ReviewModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReviewModuleService],
    }).compile();

    service = module.get<ReviewModuleService>(ReviewModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
