import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ContractModuleService } from './contract-module.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Contract Management')
@ApiBearerAuth('JWT-auth')
@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractModuleController {
  constructor(private readonly contractModuleService: ContractModuleService) {}

  /**
   * Tạo một hợp đồng mới
   * @param createContractDto Dữ liệu tạo hợp đồng
   * @param req Thông tin người dùng từ JWT
   * @returns Hợp đồng vừa tạo
   */
  @Post()
  @ApiOperation({ summary: 'Tạo hợp đồng mới' })
  create(
    @Body() createContractDto: CreateContractDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.contractModuleService.create(
      createContractDto,
      req.user.sub,
      req.user.orgId,
    );
  }

  /**
   * Gửi hợp đồng để phê duyệt
   * @param id ID của hợp đồng
   * @param approverId ID của người phê duyệt
   * @returns Trạng thái hợp đồng sau khi gửi duyệt
   */
  @Post(':id/submit')
  @ApiOperation({
    summary: 'Gửi hợp đồng để phê duyệt (tự động theo ApprovalMatrix)',
  })
  submitForApproval(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.contractModuleService.submitForApproval(
      id,
      req.user.sub,
      req.user.orgId,
    );
  }

  /**
   * Lấy danh sách tất cả các hợp đồng của tổ chức hiện tại
   * @param req Thông tin người dùng từ JWT
   * @returns Danh sách hợp đồng
   */
  @Get()
  @ApiOperation({ summary: 'Lấy tất cả hợp đồng' })
  findAll(@Request() req: { user: JwtPayload }) {
    return this.contractModuleService.findAll(req.user.orgId);
  }

  /**
   * Lấy thông tin chi tiết một hợp đồng theo ID
   * @param id ID của hợp đồng
   * @returns Chi tiết hợp đồng
   */
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết hợp đồng theo ID' })
  findOne(@Param('id') id: string) {
    return this.contractModuleService.findOne(id);
  }

  /**
   * Cập nhật thông tin hợp đồng theo ID
   * @param id ID của hợp đồng
   * @param updateContractDto Dữ liệu cập nhật hợp đồng
   * @returns Hợp đồng sau khi cập nhật
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật hợp đồng theo ID' })
  update(
    @Param('id') id: string,
    @Body() updateContractDto: UpdateContractDto,
  ) {
    return this.contractModuleService.update(id, updateContractDto);
  }

  /**
   * Ký hợp đồng (Hỗ trợ xác thực qua token cho nhà cung cấp external)
   */
  @Post(':id/sign')
  @ApiOperation({ summary: 'Ký hợp đồng' })
  async sign(
    @Param('id') id: string,
    @Request() req: any, // Sử dụng any để chấp nhận cả authenticated user và request từ external
    @Body('isBuyer') isBuyer: boolean,
    @Body('token') token?: string, // Token cho external
  ) {
    if (token) {
       // Logic xác thực token sẽ được implement ở service hoặc guard riêng
       // Tạm thời bỏ qua phần xác thực trong controller này
    }
    
    // Nếu không có token, yêu cầu login như cũ
    if (!token && !req.user) {
        throw new BadRequestException('Yêu cầu đăng nhập hoặc mã token hợp lệ');
    }

    const userId = req.user?.sub ?? 'EXTERNAL_USER';
    return this.contractModuleService.signContract(id, userId, isBuyer);
  }

  /**
   * Cập nhật trạng thái milestone của hợp đồng
   * @param milestoneId ID của milestone
   * @param body Dữ liệu cập nhật milestone
   */
  @Patch('milestones/:milestoneId')
  @ApiOperation({ summary: 'Cập nhật milestone hợp đồng' })
  updateMilestone(
    @Param('milestoneId') milestoneId: string,
    @Body() body: { status: string; completionDate?: Date },
  ) {
    return this.contractModuleService.updateMilestone(milestoneId, body);
  }

  /**
   * Lấy danh sách hợp đồng theo nhà cung cấp
   * @param supplierId ID của nhà cung cấp
   */
  @Get('supplier/:supplierId')
  @ApiOperation({ summary: 'Lấy hợp đồng theo nhà cung cấp' })
  findBySupplier(@Param('supplierId') supplierId: string) {
    return this.contractModuleService.findBySupplier(supplierId);
  }

  /**
   * Chấm dứt hợp đồng (ACTIVE hoặc PENDING_SIGNATURE)
   * @param id ID của hợp đồng
   * @param reason Lý do chấm dứt
   */
  @Post(':id/terminate')
  @ApiOperation({ summary: 'Chấm dứt hợp đồng' })
  terminate(@Param('id') id: string, @Body('reason') reason: string) {
    return this.contractModuleService.terminate(id, reason);
  }

  /**
   * Xóa một hợp đồng theo ID
   * @param id ID của hợp đồng cần xóa
   * @returns Kết quả xóa
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa hợp đồng theo ID' })
  remove(@Param('id') id: string) {
    return this.contractModuleService.remove(id);
  }
}
