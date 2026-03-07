import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { AuditModuleService } from './audit-module.service';
import { CreateAuditLogDto } from './dto/audit.dto';

@ApiTags('Audit Logs')
@Controller('audit')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class AuditModuleController {
  constructor(private readonly auditService: AuditModuleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new audit log (usually internal)' })
  async create(
    @Body() dto: CreateAuditLogDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.auditService.create(dto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all audit logs for the current organization' })
  async findAll(@Request() req: { user: JwtPayload }) {
    return this.auditService.findAll(req.user);
  }

  @Get('entity')
  @ApiOperation({ summary: 'Get audit logs by entity type and ID' })
  async findByEntity(@Query('type') type: string, @Query('id') id: string) {
    return this.auditService.findByEntity(type, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get audit log detail by ID' })
  async findOne(@Param('id') id: string) {
    // Controller handles ID as string from URL, service handles it as number|bigint
    return this.auditService.findOne(BigInt(id));
  }
}
