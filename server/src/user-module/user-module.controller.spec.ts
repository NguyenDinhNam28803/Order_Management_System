import { Test, TestingModule } from '@nestjs/testing';
import { UserModuleController } from './user-module.controller';
import { UserModuleService } from './user-module.service';

describe('UserModuleController', () => {
  let controller: UserModuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserModuleController],
      providers: [UserModuleService],
    }).compile();

    controller = module.get<UserModuleController>(UserModuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
