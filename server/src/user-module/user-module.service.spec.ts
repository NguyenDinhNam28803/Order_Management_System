import { Test, TestingModule } from '@nestjs/testing';
import { UserModuleService } from './user-module.service';
import { UserRepository } from './user.repository';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('UserModuleService', () => {
  let service: UserModuleService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let repository: UserRepository;

  const mockUserRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserModuleService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<UserModuleService>(UserModuleService);
    repository = module.get<UserRepository>(UserRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
