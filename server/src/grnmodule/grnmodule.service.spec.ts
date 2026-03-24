import { Test, TestingModule } from '@nestjs/testing';
import { GrnmoduleService } from './grnmodule.service';

describe('GrnmoduleService', () => {
  let service: GrnmoduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GrnmoduleService],
    }).compile();

    service = module.get<GrnmoduleService>(GrnmoduleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
