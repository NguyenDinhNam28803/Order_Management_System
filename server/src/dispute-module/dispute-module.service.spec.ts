import { Test, TestingModule } from '@nestjs/testing';
import { DisputeModuleService } from './dispute-module.service';

describe('DisputeModuleService', () => {
  let service: DisputeModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DisputeModuleService],
    }).compile();

    service = module.get<DisputeModuleService>(DisputeModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
