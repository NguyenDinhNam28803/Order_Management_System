import { Test, TestingModule } from '@nestjs/testing';
import { ReportModuleService } from './report-module.service';

describe('ReportModuleService', () => {
  let service: ReportModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportModuleService],
    }).compile();

    service = module.get<ReportModuleService>(ReportModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
