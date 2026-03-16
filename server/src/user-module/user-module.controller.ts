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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserModule } from './entities/user-module.entity';

@ApiTags('User Module')
@Controller('user-module')
export class UserModuleController {
  constructor(private readonly userModuleService: UserModuleService) {}

  /**
   * Lấy thông tin hồ sơ của người dùng hiện tại đang đăng nhập
   * @param req Yêu cầu chứa thông tin người dùng đã xác thực từ JWT
   * @returns Thông tin chi tiết của người dùng hiện tại
   */
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({
    summary: 'Lấy thông tin hồ sơ người dùng',
    description:
      'Trả về thông tin chi tiết của người dùng hiện tại dựa trên JWT đã xác thực',
  })
  @ApiResponse({ status: 200, type: UserModule })
  getProfile(@Request() req) {
    // req.user contains the decoded JWT payload from JwtAuthGuard
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.userModuleService.findOne(req.user.sub);
  }

  /**
   * Tạo một người dùng mới trong hệ thống
   * @param createUserModuleDto Dữ liệu tạo người dùng
   * @returns Người dùng vừa được tạo
   */
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
   * @returns Danh sách người dùng
   */
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, type: [UserModule] })
  findAll() {
    return this.userModuleService.findAll();
  }

  /**
   * Lấy thông tin chi tiết của một người dùng cụ thể theo ID
   * @param id ID của người dùng
   * @returns Thông tin chi tiết người dùng
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, type: UserModule })
  findOne(@Param('id') id: string) {
    return this.userModuleService.findOne(id);
  }

  /**
   * Cập nhật thông tin của một người dùng theo ID
   * @param id ID của người dùng cần cập nhật
   * @param updateUserModuleDto Dữ liệu cập nhật
   * @returns Người dùng sau khi cập nhật
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, type: UserModule })
  update(
    @Param('id') id: string,
    @Body() updateUserModuleDto: UpdateUserModuleDto,
  ) {
    return this.userModuleService.update(id, updateUserModuleDto);
  }

  /**
   * Xóa một người dùng khỏi hệ thống theo ID
   * @param id ID của người dùng cần xóa
   * @returns Kết quả xóa
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string) {
    return this.userModuleService.remove(id);
  }
}
