import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PomoduleService } from './pomodule.service';
import { CreatePoDto } from './dto/create-po.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';

@ApiTags('Purchase Order (PO)')
@Controller('po')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class PomoduleController {
  constructor(private readonly poService: PomoduleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new PO from a Quotation' })
  create(@Body() createPoDto: CreatePoDto, @Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.poService.create(createPoDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all POs for organization' })
  findAll(@Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.poService.findAll(req.user.orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get PO detail' })
  findOne(@Param('id') id: string) {
    return this.poService.findOne(id);
  }
}
