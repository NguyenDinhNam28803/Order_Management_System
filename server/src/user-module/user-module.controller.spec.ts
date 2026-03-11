import { Test, TestingModule } from '@nestjs/testing';
import { UserModuleController } from './user-module.controller';
import { UserModuleService } from './user-module.service';

describe('UserModuleController', () => {
  let controller: UserModuleController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let service: UserModuleService;

  const mockUserModuleService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserModuleController],
      providers: [
        {
          provide: UserModuleService,
          useValue: mockUserModuleService,
        },
      ],
    }).compile();

    controller = module.get<UserModuleController>(UserModuleController);
    service = module.get<UserModuleService>(UserModuleService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
