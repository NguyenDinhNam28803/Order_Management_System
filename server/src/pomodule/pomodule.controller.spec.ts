import { Test, TestingModule } from '@nestjs/testing';
import { PomoduleController } from './pomodule.controller';
import { PomoduleService } from './pomodule.service';

describe('PomoduleController', () => {
  let controller: PomoduleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PomoduleController],
      providers: [PomoduleService],
    }).compile();

    controller = module.get<PomoduleController>(PomoduleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
