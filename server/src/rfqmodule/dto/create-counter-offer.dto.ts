import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID, IsOptional } from 'class-validator';

export class CreateCounterOfferDto {
  @ApiProperty({ description: 'Quotation ID' })
  @IsUUID()
  quotationId: string;

  @ApiProperty({ description: 'Offer type (e.g., BUYER_OFFER, COUNTER_OFFER)' })
  @IsString()
  offerType: string;

  @ApiProperty({ description: 'Proposed price' })
  @IsNumber()
  @IsOptional()
  proposedPrice?: number;

  @ApiProperty({ description: 'Proposed terms' })
  @IsString()
  @IsOptional()
  proposedTerms?: string;

  @ApiProperty({ description: 'AI Suggestion for this negotiation' })
  @IsString()
  @IsOptional()
  aiSuggestion?: string;
}
