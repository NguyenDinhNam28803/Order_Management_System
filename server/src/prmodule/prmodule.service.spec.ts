import { Test, TestingModule } from '@nestjs/testing';
import { PrmoduleService } from './prmodule.service';

describe('PrmoduleService', () => {
  let service: PrmoduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrmoduleService],
    }).compile();

    service = module.get<PrmoduleService>(PrmoduleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
