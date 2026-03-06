import { Test, TestingModule } from '@nestjs/testing';
import { PrmoduleController } from './prmodule.controller';
import { PrmoduleService } from './prmodule.service';

describe('PrmoduleController', () => {
  let controller: PrmoduleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrmoduleController],
      providers: [PrmoduleService],
    }).compile();

    controller = module.get<PrmoduleController>(PrmoduleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
