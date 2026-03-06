import { Test, TestingModule } from '@nestjs/testing';
import { PomoduleService } from './pomodule.service';

describe('PomoduleService', () => {
  let service: PomoduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PomoduleService],
    }).compile();

    service = module.get<PomoduleService>(PomoduleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
