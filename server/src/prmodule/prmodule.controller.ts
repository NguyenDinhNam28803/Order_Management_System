import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PrmoduleService } from './prmodule.service';
import { CreatePrDto } from './dto/create-pr.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';

@ApiTags('Purchase Requisition (PR)')
@Controller('pr')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class PrmoduleController {
  constructor(private readonly prService: PrmoduleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new Purchase Requisition' })
  async create(
    @Body() createPrDto: CreatePrDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.prService.create(createPrDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all PRs for the current organization' })
  async findAll(@Request() req: { user: JwtPayload }) {
    return this.prService.findAll(req.user);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my Purchase Requisitions' })
  async findMyPrs(@Request() req: { user: JwtPayload }) {
    return this.prService.findMyPrs(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get PR detail by ID' })
  async findOne(@Param('id') id: string) {
    return this.prService.findOne(id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit a draft PR for approval' })
  async submit(@Param('id') id: string) {
    return this.prService.submit(id);
  }
}
