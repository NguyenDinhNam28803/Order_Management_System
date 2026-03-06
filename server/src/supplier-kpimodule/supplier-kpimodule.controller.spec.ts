import { Test, TestingModule } from '@nestjs/testing';
import { SupplierKpimoduleController } from './supplier-kpimodule.controller';
import { SupplierKpimoduleService } from './supplier-kpimodule.service';

describe('SupplierKpimoduleController', () => {
  let controller: SupplierKpimoduleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupplierKpimoduleController],
      providers: [SupplierKpimoduleService],
    }).compile();

    controller = module.get<SupplierKpimoduleController>(SupplierKpimoduleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
