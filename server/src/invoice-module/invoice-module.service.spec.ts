import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoiceModuleService } from './invoice-module.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationModuleService } from '../notification-module/notification-module.service';
import { AiService } from '../ai-service/ai-service.service';
import { InvoiceStatus } from '@prisma/client';

const mockPrisma = {
  supplierInvoice: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  purchaseOrder: {
    update: jest.fn(),
  },
  goodsReceipt: {
    findUnique: jest.fn(),
  },
  budgetAllocation: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockNotificationService = { sendDirectEmail: jest.fn() };
const mockAiService = {};

const makeInvoiceWithItems = (overrides: Partial<any> = {}) => ({
  id: 'inv-1',
  orgId: 'org-1',
  grnId: 'grn-1',
  status: InvoiceStatus.MATCHING,
  exceptionReason: null,
  po: {
    id: 'po-1',
    items: [{ id: 'poi-1', unitPrice: 100 }],
  },
  grn: {
    id: 'grn-1',
    items: [
      {
        id: 'grni-1',
        poItemId: 'poi-1',
        receivedQty: 10,
        acceptedQty: 10,
      },
    ],
  },
  items: [
    {
      id: 'ii-1',
      poItemId: 'poi-1',
      grnItemId: 'grni-1',
      qty: 10,
      unitPrice: 100,
      poItem: { id: 'poi-1', unitPrice: 100 },
      grnItem: {
        id: 'grni-1',
        poItemId: 'poi-1',
        receivedQty: 10,
        acceptedQty: 10,
      },
    },
  ],
  ...overrides,
});

describe('InvoiceModuleService', () => {
  let service: InvoiceModuleService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceModuleService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationModuleService, useValue: mockNotificationService },
        { provide: AiService, useValue: mockAiService },
      ],
    }).compile();

    service = module.get<InvoiceModuleService>(InvoiceModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── markAsPaid ──────────────────────────────────────────────────────────────

  describe('markAsPaid()', () => {
    it('throws NotFoundException when invoice not found', async () => {
      mockPrisma.supplierInvoice.findUnique.mockResolvedValue(null);
      await expect(service.markAsPaid('bad-id')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when invoice status is not PAYMENT_APPROVED', async () => {
      mockPrisma.supplierInvoice.findUnique.mockResolvedValue({
        id: 'inv-1',
        status: InvoiceStatus.MATCHING,
        po: {},
        totalAmount: 1000,
      });
      await expect(service.markAsPaid('inv-1')).rejects.toThrow(BadRequestException);
    });

    it('updates invoice to PAID status inside transaction', async () => {
      const invoice = {
        id: 'inv-1',
        status: InvoiceStatus.PAYMENT_APPROVED,
        totalAmount: 1000,
        po: { orgId: 'org-1', deptId: null, costCenterId: null },
      };
      mockPrisma.supplierInvoice.findUnique.mockResolvedValue(invoice);

      const updatedInvoice = {
        ...invoice,
        status: InvoiceStatus.PAID,
        subtotal: 1000,
        taxRate: null,
        totalAmount: 1000,
      };
      mockPrisma.$transaction.mockImplementation(async (fn: any) => {
        const tx = {
          supplierInvoice: { update: jest.fn().mockResolvedValue(updatedInvoice) },
          budgetAllocation: { findFirst: jest.fn().mockResolvedValue(null) },
        };
        return fn(tx);
      });

      const result = await service.markAsPaid('inv-1');
      expect(result.status).toBe(InvoiceStatus.PAID);
    });
  });

  // ─── runThreeWayMatching ─────────────────────────────────────────────────────

  describe('runThreeWayMatching()', () => {
    it('sets AUTO_APPROVED when qty and price are within tolerance', async () => {
      mockPrisma.supplierInvoice.findUnique.mockResolvedValue(makeInvoiceWithItems());
      mockPrisma.supplierInvoice.update.mockResolvedValue({});
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.runThreeWayMatching('inv-1');

      expect(mockPrisma.supplierInvoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: InvoiceStatus.AUTO_APPROVED }),
        }),
      );
    });

    it('sets EXCEPTION_REVIEW when invoice qty exceeds accepted qty beyond 2% tolerance', async () => {
      const invoice = makeInvoiceWithItems();
      // GRN accepted 10, invoice claims 13 (30% over — exceeds 2% tolerance)
      invoice.items[0].qty = 13;
      invoice.grn.items[0].acceptedQty = 10;

      mockPrisma.supplierInvoice.findUnique.mockResolvedValue(invoice);
      mockPrisma.supplierInvoice.update.mockResolvedValue({});
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.runThreeWayMatching('inv-1');

      expect(mockPrisma.supplierInvoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: InvoiceStatus.EXCEPTION_REVIEW }),
        }),
      );
    });

    it('sets EXCEPTION_REVIEW when unit price exceeds PO price beyond 1% tolerance', async () => {
      const invoice = makeInvoiceWithItems();
      // PO price 100, invoice claims 110 (10% over — exceeds 1% tolerance)
      invoice.items[0].unitPrice = 110;
      invoice.items[0].poItem.unitPrice = 100;

      mockPrisma.supplierInvoice.findUnique.mockResolvedValue(invoice);
      mockPrisma.supplierInvoice.update.mockResolvedValue({});
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.runThreeWayMatching('inv-1');

      expect(mockPrisma.supplierInvoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: InvoiceStatus.EXCEPTION_REVIEW }),
        }),
      );
    });

    it('sets EXCEPTION_REVIEW when grnItem is missing', async () => {
      const invoice = makeInvoiceWithItems();
      (invoice.items[0] as any).grnItem = undefined;
      invoice.grn.items = []; // no fallback match either

      mockPrisma.supplierInvoice.findUnique.mockResolvedValue(invoice);
      mockPrisma.supplierInvoice.update.mockResolvedValue({});
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.runThreeWayMatching('inv-1');

      expect(mockPrisma.supplierInvoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: InvoiceStatus.EXCEPTION_REVIEW }),
        }),
      );
    });

    it('accepts qty exactly at 2% tolerance boundary', async () => {
      const invoice = makeInvoiceWithItems();
      // accepted = 10, invoice = 10.2 (exactly 2%)
      invoice.items[0].qty = 10.2;
      invoice.grn.items[0].acceptedQty = 10;

      mockPrisma.supplierInvoice.findUnique.mockResolvedValue(invoice);
      mockPrisma.supplierInvoice.update.mockResolvedValue({});
      mockPrisma.user.findMany.mockResolvedValue([]);

      await service.runThreeWayMatching('inv-1');

      expect(mockPrisma.supplierInvoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: InvoiceStatus.AUTO_APPROVED }),
        }),
      );
    });

    it('returns early without updating when invoice not found', async () => {
      mockPrisma.supplierInvoice.findUnique.mockResolvedValue(null);

      await service.runThreeWayMatching('bad-id');

      expect(mockPrisma.supplierInvoice.update).not.toHaveBeenCalled();
    });
  });
});
