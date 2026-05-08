import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GrnmoduleService } from './grnmodule.service';
import { GrnRepository } from './grn.repository';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationModuleService } from '../notification-module/notification-module.service';
import { PoStatus } from '@prisma/client';

const mockRepository = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
};

const mockPrisma = {
  purchaseOrder: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  grnItem: {
    groupBy: jest.fn(),
  },
};

const mockNotificationService = {
  sendExternalEmailWithMagicLink: jest.fn(),
};

const makePo = (overrides: Partial<any> = {}) => ({
  id: 'po-1',
  orgId: 'org-1',
  status: PoStatus.ISSUED,
  supplierId: 'sup-1',
  items: [
    { id: 'item-1', sku: 'SKU-001', qty: 10 },
    { id: 'item-2', sku: 'SKU-002', qty: 5 },
  ],
  ...overrides,
});

const makeUser = () =>
  ({ sub: 'user-1', orgId: 'org-1', role: 'BUYER' }) as any;

describe('GrnmoduleService', () => {
  let service: GrnmoduleService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GrnmoduleService,
        { provide: GrnRepository, useValue: mockRepository },
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: NotificationModuleService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = module.get<GrnmoduleService>(GrnmoduleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const dto = {
      poId: 'po-1',
      items: [{ poItemId: 'item-1', receivedQty: 3, notes: '' }],
    } as any;

    it('throws NotFoundException when PO does not exist', async () => {
      mockPrisma.purchaseOrder.findUnique.mockResolvedValue(null);

      await expect(service.create(dto, makeUser())).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when PO status is not allowed', async () => {
      mockPrisma.purchaseOrder.findUnique.mockResolvedValue(
        makePo({ status: PoStatus.CANCELLED }),
      );

      await expect(service.create(dto, makeUser())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when item does not belong to PO', async () => {
      mockPrisma.purchaseOrder.findUnique.mockResolvedValue(makePo());

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const badDto = {
        poId: 'po-1',
        items: [{ poItemId: 'item-999', receivedQty: 1 }],
      } as any;

      await expect(service.create(badDto, makeUser())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when received qty exceeds PO qty', async () => {
      mockPrisma.purchaseOrder.findUnique.mockResolvedValue(makePo());
      // No previous receipts
      mockPrisma.grnItem.groupBy.mockResolvedValue([]);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const overQtyDto = {
        poId: 'po-1',
        items: [{ poItemId: 'item-1', receivedQty: 99 }],
      } as any;

      await expect(service.create(overQtyDto, makeUser())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('creates GRN and updates PO status to IN_PROGRESS', async () => {
      const po = makePo();
      mockPrisma.purchaseOrder.findUnique.mockResolvedValue(po);
      mockPrisma.grnItem.groupBy.mockResolvedValue([]);

      const createdGrn = { id: 'grn-1', grnNumber: 'GRN-2024-12345' };
      mockRepository.create.mockResolvedValue(createdGrn);
      mockPrisma.purchaseOrder.update.mockResolvedValue({});

      // Prevent fire-and-forget notification from throwing
      jest
        .spyOn(service as any, 'notifyGrnMilestoneUpdate')
        .mockResolvedValue(undefined);

      const result = await service.create(dto, makeUser());

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.purchaseOrder.update).toHaveBeenCalledWith({
        where: { id: 'po-1' },
        data: { status: PoStatus.IN_PROGRESS },
      });
      expect(result).toEqual(createdGrn);
    });

    it('accumulates previous receipts when checking qty limit', async () => {
      const po = makePo();
      mockPrisma.purchaseOrder.findUnique.mockResolvedValue(po);
      // 8 units already received for item-1 (PO qty = 10)
      mockPrisma.grnItem.groupBy.mockResolvedValue([
        { poItemId: 'item-1', _sum: { receivedQty: 8 } },
      ]);

      // Trying to receive 3 more would push total to 11 > 10
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const dto2 = {
        poId: 'po-1',
        items: [{ poItemId: 'item-1', receivedQty: 3 }],
      } as any;

      await expect(service.create(dto2, makeUser())).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
