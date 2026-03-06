import { Test, TestingModule } from '@nestjs/testing';
import { AdminModuleService } from './admin-module.service';

describe('AdminModuleService', () => {
  let service: AdminModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminModuleService],
    }).compile();

    service = module.get<AdminModuleService>(AdminModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
