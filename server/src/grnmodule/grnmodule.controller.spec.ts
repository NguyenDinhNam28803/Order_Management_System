import { Test, TestingModule } from '@nestjs/testing';
import { GrnmoduleController } from './grnmodule.controller';
import { GrnmoduleService } from './grnmodule.service';

describe('GrnmoduleController', () => {
  let controller: GrnmoduleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GrnmoduleController],
      providers: [GrnmoduleService],
    }).compile();

    controller = module.get<GrnmoduleController>(GrnmoduleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
