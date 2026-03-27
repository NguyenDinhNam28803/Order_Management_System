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
   * Lấy danh sách tất cả người dùng trong hệ thống
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả người dùng' })
  @ApiResponse({ status: 200, type: [UserModule] })
  findAll() {
    return this.userModuleService.findAll();
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
