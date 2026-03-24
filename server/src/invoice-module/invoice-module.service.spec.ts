import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceModuleService } from './invoice-module.service';

describe('InvoiceModuleService', () => {
  let service: InvoiceModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoiceModuleService],
    }).compile();

    service = module.get<InvoiceModuleService>(InvoiceModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
