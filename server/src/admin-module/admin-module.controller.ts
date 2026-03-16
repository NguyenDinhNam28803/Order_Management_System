import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AdminModuleService } from './admin-module.service';

@Controller('admin-module')
export class AdminModuleController {
  constructor(private readonly adminModuleService: AdminModuleService) {}

  /**
   * Tạo mới một bản ghi quản trị
   * @returns Bản ghi vừa được tạo
   */
  @Post()
  create() {
    return this.adminModuleService.create();
  }

  /**
   * Lấy danh sách tất cả các bản ghi quản trị
   * @returns Danh sách bản ghi
   */
  @Get()
  findAll() {
    return this.adminModuleService.findAll();
  }

  /**
   * Lấy thông tin chi tiết một bản ghi quản trị theo ID
   * @param id ID của bản ghi
   * @returns Thông tin chi tiết bản ghi
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminModuleService.findOne(+id);
  }

  /**
   * Cập nhật thông tin một bản ghi quản trị theo ID
   * @param id ID của bản ghi cần cập nhật
   * @returns Bản ghi sau khi cập nhật
   */
  @Patch(':id')
  update(@Param('id') id: string) {
    return this.adminModuleService.update(+id);
  }

  /**
   * Xóa một bản ghi quản trị theo ID
   * @param id ID của bản ghi cần xóa
   * @returns Kết quả xóa
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.adminModuleService.remove(+id);
  }
}
