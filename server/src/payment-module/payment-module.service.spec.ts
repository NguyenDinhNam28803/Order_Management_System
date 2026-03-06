import { Test, TestingModule } from '@nestjs/testing';
import { PaymentModuleService } from './payment-module.service';

describe('PaymentModuleService', () => {
  let service: PaymentModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentModuleService],
    }).compile();

    service = module.get<PaymentModuleService>(PaymentModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
