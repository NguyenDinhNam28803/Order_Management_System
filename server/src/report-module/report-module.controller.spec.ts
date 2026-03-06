import { Test, TestingModule } from '@nestjs/testing';
import { ReportModuleController } from './report-module.controller';
import { ReportModuleService } from './report-module.service';

describe('ReportModuleController', () => {
  let controller: ReportModuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportModuleController],
      providers: [ReportModuleService],
    }).compile();

    controller = module.get<ReportModuleController>(ReportModuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
