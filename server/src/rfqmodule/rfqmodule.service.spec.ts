import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RfqmoduleService } from './rfqmodule.service';
import { RfqRepository } from './rfq.repository';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationModuleService } from '../notification-module/notification-module.service';
import { AiService } from '../ai-service/ai-service.service';
import { AutomationService } from '../common/automation/automation.service';
import { PrStatus } from '@prisma/client';

const mockRepository = {
  create: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  findQuotationById: jest.fn(),
};

const mockPrisma = {
  purchaseRequisition: { findFirst: jest.fn() },
  rfqSupplier: { createMany: jest.fn() },
  user: { findMany: jest.fn() },
  rfqQuotation: { update: jest.fn() },
};

const mockNotificationService = { sendExternalEmailWithMagicLink: jest.fn() };
const mockAiService = { getCompanySuggestion: jest.fn(), analyzeQuotation: jest.fn() };
const mockAutomationService = {};

const makeUser = () => ({ sub: 'user-1', orgId: 'org-1', role: 'BUYER' });

const makeRfq = (overrides: Partial<any> = {}) => ({
  id: 'rfq-1',
  rfqNumber: 'RFQ-2024-1234',
  title: 'Test RFQ',
  deadline: new Date('2024-12-31'),
  items: [],
  suppliers: [],
  ...overrides,
});

describe('RfqmoduleService', () => {
  let service: RfqmoduleService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RfqmoduleService,
        { provide: RfqRepository, useValue: mockRepository },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationModuleService, useValue: mockNotificationService },
        { provide: AiService, useValue: mockAiService },
        { provide: AutomationService, useValue: mockAutomationService },
      ],
    }).compile();

    service = module.get<RfqmoduleService>(RfqmoduleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── create() ────────────────────────────────────────────────────────────────

  describe('create()', () => {
    const dto = { prId: 'pr-1', supplierIds: [] } as any;

    it('throws NotFoundException when PR does not exist', async () => {
      mockPrisma.purchaseRequisition.findFirst.mockResolvedValue(null);

      await expect(service.create(dto, makeUser())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when PR is not APPROVED', async () => {
      mockPrisma.purchaseRequisition.findFirst.mockResolvedValue({
        id: 'pr-1',
        status: PrStatus.PENDING_APPROVAL,
      });

      await expect(service.create(dto, makeUser())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('creates RFQ when PR is APPROVED', async () => {
      mockPrisma.purchaseRequisition.findFirst.mockResolvedValue({
        id: 'pr-1',
        status: PrStatus.APPROVED,
      });

      const rfq = makeRfq();
      mockRepository.create.mockResolvedValue(rfq);

      const result = await service.create(dto, makeUser());

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(rfq);
    });

    it('generates an RFQ number matching RFQ-YYYY-NNNN pattern', async () => {
      mockPrisma.purchaseRequisition.findFirst.mockResolvedValue({
        id: 'pr-1',
        status: PrStatus.APPROVED,
      });
      mockRepository.create.mockResolvedValue(makeRfq());

      await service.create(dto, makeUser());

      const createCall = mockRepository.create.mock.calls[0];
      const rfqNumber: string = createCall[3]; // 4th arg is rfqNumber
      expect(rfqNumber).toMatch(/^RFQ-\d{4}-\d{4}$/);
    });

    it('sends invitation emails when supplierIds are provided', async () => {
      mockPrisma.purchaseRequisition.findFirst.mockResolvedValue({
        id: 'pr-1',
        status: PrStatus.APPROVED,
      });

      const rfq = makeRfq({ items: [{ description: 'Laptop', qty: 5, unit: 'cái' }] });
      mockRepository.create.mockResolvedValue(rfq);

      const supplierUser = {
        id: 'u-1',
        email: 'supplier@test.com',
        fullName: 'Test Supplier',
        orgId: 'sup-org-1',
        organization: { name: 'Supplier Co.' },
      };
      mockPrisma.user.findMany.mockResolvedValue([supplierUser]);

      const dtoWithSuppliers = { prId: 'pr-1', supplierIds: ['sup-org-1'] } as any;
      await service.create(dtoWithSuppliers, makeUser());

      expect(mockNotificationService.sendExternalEmailWithMagicLink).toHaveBeenCalledTimes(1);
    });

    it('does not fail if email sending fails', async () => {
      mockPrisma.purchaseRequisition.findFirst.mockResolvedValue({
        id: 'pr-1',
        status: PrStatus.APPROVED,
      });
      mockRepository.create.mockResolvedValue(makeRfq());
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'u-1', email: 'supplier@test.com', orgId: 'sup-1', organization: { name: 'Co' } },
      ]);
      mockNotificationService.sendExternalEmailWithMagicLink.mockRejectedValue(
        new Error('SMTP down'),
      );

      const dtoWithSuppliers = { prId: 'pr-1', supplierIds: ['sup-1'] } as any;
      await expect(service.create(dtoWithSuppliers, makeUser())).resolves.toBeDefined();
    });
  });

  // ─── searchAndAddSuppliers() ─────────────────────────────────────────────────

  describe('searchAndAddSuppliers()', () => {
    it('throws NotFoundException when RFQ does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.searchAndAddSuppliers('bad-rfq')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns empty array when AI returns no suggestions', async () => {
      mockRepository.findOne.mockResolvedValue(makeRfq({ items: [] }));
      mockAiService.getCompanySuggestion.mockResolvedValue({ data: [] });

      const result = await service.searchAndAddSuppliers('rfq-1');
      expect(result).toEqual([]);
    });

    it('creates rfqSupplier records for valid AI suggestions', async () => {
      mockRepository.findOne.mockResolvedValue(
        makeRfq({ items: [{ name: 'Laptop', description: 'Dell', qty: 5 }] }),
      );
      mockAiService.getCompanySuggestion.mockResolvedValue({
        data: ['sup-1', 'sup-2'],
      });
      mockPrisma.rfqSupplier.createMany.mockResolvedValue({ count: 2 });

      const result = await service.searchAndAddSuppliers('rfq-1');
      expect(mockPrisma.rfqSupplier.createMany).toHaveBeenCalledWith(
        expect.objectContaining({ skipDuplicates: true }),
      );
      expect(result).toEqual({ count: 2 });
    });
  });
});
