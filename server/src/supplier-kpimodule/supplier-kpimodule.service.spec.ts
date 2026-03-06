import { Test, TestingModule } from '@nestjs/testing';
import { SupplierKpimoduleService } from './supplier-kpimodule.service';

describe('SupplierKpimoduleService', () => {
  let service: SupplierKpimoduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupplierKpimoduleService],
    }).compile();

    service = module.get<SupplierKpimoduleService>(SupplierKpimoduleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
