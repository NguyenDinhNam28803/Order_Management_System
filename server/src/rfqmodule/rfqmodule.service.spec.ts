import { Test, TestingModule } from '@nestjs/testing';
import { RfqmoduleService } from './rfqmodule.service';

describe('RfqmoduleService', () => {
  let service: RfqmoduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RfqmoduleService],
    }).compile();

    service = module.get<RfqmoduleService>(RfqmoduleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
