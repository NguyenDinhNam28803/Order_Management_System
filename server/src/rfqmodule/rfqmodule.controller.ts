import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { RfqmoduleService } from './rfqmodule.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';

@ApiTags('Request for Quotation (RFQ)')
@Controller('rfq')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class RfqmoduleController {
  constructor(private readonly rfqService: RfqmoduleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new RFQ from a PR' })
  async create(@Body() createRfqDto: CreateRfqDto, @Request() req: any) {
    return this.rfqService.create(createRfqDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all RFQs for organization' })
  async findAll(@Request() req: any) {
    return this.rfqService.findAll(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get RFQ detail' })
  async findOne(@Param('id') id: string) {
    return this.rfqService.findOne(id);
  }
}
