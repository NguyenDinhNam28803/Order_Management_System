import { Test, TestingModule } from '@nestjs/testing';
import { RfqmoduleController } from './rfqmodule.controller';
import { RfqmoduleService } from './rfqmodule.service';

describe('RfqmoduleController', () => {
  let controller: RfqmoduleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RfqmoduleController],
      providers: [RfqmoduleService],
    }).compile();

    controller = module.get<RfqmoduleController>(RfqmoduleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
