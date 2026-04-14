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
} from '@nestjs/common';
import { UserModuleService } from './user-module.service';
import { CreateUserModuleDto } from './dto/create-user-module.dto';
import { UpdateUserModuleDto } from './dto/update-user-module.dto';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/roles.guard';
import { UserRole } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserModule } from './entities/user-module.entity';
import { CreateUserDelegationDto } from './dto/user-delegation.dto';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';

@ApiTags('User Module')
@Controller('users')
@ApiBearerAuth('JWT-auth')
export class UserModuleController {
  constructor(private readonly userModuleService: UserModuleService) {}

  /**
   * Lấy thông tin hồ sơ của người dùng hiện tại đang đăng nhập
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({
    summary: 'Lấy thông tin hồ sơ người dùng',
    description:
      'Trả về thông tin chi tiết của người dùng hiện tại dựa trên JWT đã xác thực',
  })
  @ApiResponse({ status: 200, type: UserModule })
  getProfile(@Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.userModuleService.findOne(req.user.sub);
  }

  // --- Delegation APIs ---

  /**
   * Tạo một ủy quyền mới (Ủy quyền cho người khác duyệt thay mình)
   */
  @UseGuards(JwtAuthGuard)
  @Post('delegations')
  @ApiOperation({
    summary: 'Tạo ủy quyền phê duyệt mới',
    description:
      'Thiết lập một người dùng khác phê duyệt thay thế mình trong một khoảng thời gian nhất định',
  })
  async createDelegation(
    @Body() dto: CreateUserDelegationDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.userModuleService.createDelegation(dto, req.user);
  }

  /**
   * Lấy danh sách các ủy quyền tôi đã tạo
   */
  @UseGuards(JwtAuthGuard)
  @Get('delegations/me')
  @ApiOperation({ summary: 'Lấy danh sách các ủy quyền của tôi' })
  async getMyDelegations(@Request() req: { user: JwtPayload }) {
    return this.userModuleService.findMyDelegations(req.user.sub);
  }

  /**
   * Bật/Tắt một bản ghi ủy quyền
   */
  @UseGuards(JwtAuthGuard)
  @Patch('delegations/:id/toggle')
  @ApiOperation({ summary: 'Bật/Tắt trạng thái ủy quyền' })
  async toggleDelegation(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
    @Request() req: { user: JwtPayload },
  ) {
    return this.userModuleService.toggleDelegation(id, req.user.sub, isActive);
  }

  /**
   * Tạo một người dùng mới trong hệ thống
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @Post()
  @ApiOperation({
    summary: 'Tạo người dùng mới',
    description:
      'Tạo một người dùng mới trong hệ thống với thông tin được cung cấp',
  })
  @ApiResponse({ status: 201, type: UserModule })
  create(@Body() createUserModuleDto: CreateUserModuleDto) {
    return this.userModuleService.create(createUserModuleDto);
  }

  /**
   * Lấy danh sách tất cả người dùng trong công ty của admin
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách người dùng trong công ty' })
  @ApiResponse({ status: 200, type: [UserModule] })
  findAll(@Request() req: { user: JwtPayload }) {
    // Filter users by admin's organization
    return this.userModuleService.findAll({ orgId: req.user.orgId });
  }

  /**
   * Lấy thông tin chi tiết của một người dùng cụ thể theo ID
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin người dùng theo ID' })
  @ApiResponse({ status: 200, type: UserModule })
  findOne(@Param('id') id: string) {
    return this.userModuleService.findOne(id);
  }

  /**
   * Cập nhật thông tin của một người dùng theo ID
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng theo ID' })
  @ApiResponse({ status: 200, type: UserModule })
  update(
    @Param('id') id: string,
    @Body() updateUserModuleDto: UpdateUserModuleDto,
  ) {
    return this.userModuleService.update(id, updateUserModuleDto);
  }

  /**
   * Xóa một người dùng khỏi hệ thống theo ID
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa người dùng theo ID' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string) {
    return this.userModuleService.remove(id);
  }
}
