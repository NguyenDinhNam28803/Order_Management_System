import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceModuleController } from './invoice-module.controller';
import { InvoiceModuleService } from './invoice-module.service';

describe('InvoiceModuleController', () => {
  let controller: InvoiceModuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceModuleController],
      providers: [InvoiceModuleService],
    }).compile();

    controller = module.get<InvoiceModuleController>(InvoiceModuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
