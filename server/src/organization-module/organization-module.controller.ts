import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrganizationModuleService } from './organization-module.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';

@ApiTags('Organizations')
@Controller('organizations')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class OrganizationModuleController {
  constructor(
    private readonly organizationService: OrganizationModuleService,
  ) {}

  @Get('my-org')
  @ApiOperation({ summary: 'Get current user organization details' })
  findMyOrg(@Req() req: Request) {
    const user = req['user'] as JwtPayload;
    return this.organizationService.findOne(user.orgId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new organization' })
  create(@Body() createDto: CreateOrganizationDto) {
    return this.organizationService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all organizations' })
  findAll(@Query() query: any) {
    return this.organizationService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  findOne(@Param('id') id: string) {
    return this.organizationService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update organization by ID' })
  update(@Param('id') id: string, @Body() updateDto: UpdateOrganizationDto) {
    return this.organizationService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate organization by ID' })
  remove(@Param('id') id: string) {
    return this.organizationService.remove(id);
  }
}
