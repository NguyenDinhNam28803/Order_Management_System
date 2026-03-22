import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationModuleService } from './organization-module.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OrganizationModuleService', () => {
  let service: OrganizationModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationModuleService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = module.get<OrganizationModuleService>(OrganizationModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
