import { Test, TestingModule } from '@nestjs/testing';
import { PaymentModuleController } from './payment-module.controller';
import { PaymentModuleService } from './payment-module.service';

describe('PaymentModuleController', () => {
  let controller: PaymentModuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentModuleController],
      providers: [PaymentModuleService],
    }).compile();

    controller = module.get<PaymentModuleController>(PaymentModuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
