import { ApiProperty } from '@nestjs/swagger';
import { RfqStatus, QuotationStatus } from '@prisma/client';

export class RfqEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  rfqNumber: string;

  @ApiProperty()
  orgId: string;

  @ApiProperty()
  prId: string;

  @ApiProperty()
  title?: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  technicalSpec?: string;

  @ApiProperty()
  deadline: Date;

  @ApiProperty()
  status: RfqStatus;

  @ApiProperty()
  minSuppliers: number;

  @ApiProperty()
  singleSourceApproved: boolean;

  @ApiProperty()
  singleSourceReason?: string;

  @ApiProperty()
  singleSourceApproverId?: string;

  @ApiProperty()
  aiSuggestedAt?: Date;

  @ApiProperty()
  aiAnalysisAt?: Date;

  @ApiProperty()
  aiReport: Record<string, any>;

  @ApiProperty()
  awardedSupplierId?: string;

  @ApiProperty()
  awardedAt?: Date;

  @ApiProperty()
  createdById: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class RfqItemEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  rfqId: string;

  @ApiProperty()
  prItemId?: string;

  @ApiProperty()
  categoryId?: string;

  @ApiProperty()
  lineNumber: number;

  @ApiProperty()
  sku?: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  qty: number;

  @ApiProperty()
  unit: string;

  @ApiProperty()
  targetPrice?: number;

  @ApiProperty()
  techRequirement?: string;

  @ApiProperty()
  createdAt: Date;
}

export class RfqQuotationEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  rfqId: string;

  @ApiProperty()
  supplierId: string;

  @ApiProperty()
  quotationNumber: string;

  @ApiProperty()
  totalPrice: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  leadTimeDays: number;

  @ApiProperty()
  paymentTerms?: string;

  @ApiProperty()
  deliveryTerms?: string;

  @ApiProperty()
  validityDays: number;

  @ApiProperty()
  status: QuotationStatus;

  @ApiProperty()
  notes?: string;

  @ApiProperty()
  aiScore?: number;

  @ApiProperty()
  aiBreakdown: Record<string, any>;

  @ApiProperty()
  aiFlags: any[];

  @ApiProperty()
  submittedAt?: Date;

  @ApiProperty()
  reviewedAt?: Date;

  @ApiProperty()
  reviewedById?: string;

  @ApiProperty()
  overrideReason?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class RfqQuotationItemEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  quotationId: string;

  @ApiProperty()
  rfqItemId: string;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  qtyOffered?: number;

  @ApiProperty()
  discountPct: number;

  @ApiProperty()
  leadTimeDays?: number;

  @ApiProperty()
  notes?: string;

  @ApiProperty()
  createdAt: Date;
}

export class RfqQaThreadEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  rfqId: string;

  @ApiProperty()
  supplierId: string;

  @ApiProperty()
  question: string;

  @ApiProperty()
  answer?: string;

  @ApiProperty()
  askedById: string;

  @ApiProperty()
  answeredById?: string;

  @ApiProperty()
  askedAt: Date;

  @ApiProperty()
  answeredAt?: Date;

  @ApiProperty()
  isPublic: boolean;
}

export class RfqCounterOfferEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  quotationId: string;

  @ApiProperty()
  offeredById: string;

  @ApiProperty()
  offerType: string;

  @ApiProperty()
  proposedPrice?: number;

  @ApiProperty()
  proposedTerms?: string;

  @ApiProperty()
  aiSuggestion?: string;

  @ApiProperty()
  response?: string;

  @ApiProperty()
  respondedAt?: Date;

  @ApiProperty()
  createdAt: Date;
}
