import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ContractModuleService } from './contract-module.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractModuleController {
  constructor(private readonly contractModuleService: ContractModuleService) {}

  @Post()
  create(@Body() createContractDto: CreateContractDto, @Request() req: { user: JwtPayload }) {
    return this.contractModuleService.create(createContractDto, req.user.sub, req.user.orgId);
  }

  @Post(':id/submit')
  submitForApproval(@Param('id') id: string, @Body('approverId') approverId: string) {
    return this.contractModuleService.submitForApproval(id, approverId);
  }

  @Get()
  findAll(@Request() req: { user: JwtPayload }) {
    return this.contractModuleService.findAll(req.user.orgId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractModuleService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateContractDto: UpdateContractDto) {
    return this.contractModuleService.update(id, updateContractDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contractModuleService.remove(id);
  }
}
