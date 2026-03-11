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

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, type: UserModule })
  getProfile(@Request() req) {
    // req.user contains the decoded JWT payload from JwtAuthGuard
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.userModuleService.findOne(req.user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, type: UserModule })
  create(@Body() createUserModuleDto: CreateUserModuleDto) {
    return this.userModuleService.create(createUserModuleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, type: [UserModule] })
  findAll() {
    return this.userModuleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, type: UserModule })
  findOne(@Param('id') id: string) {
    return this.userModuleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, type: UserModule })
  update(
    @Param('id') id: string,
    @Body() updateUserModuleDto: UpdateUserModuleDto,
  ) {
    return this.userModuleService.update(id, updateUserModuleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 200 })
  remove(@Param('id') id: string) {
    return this.userModuleService.remove(id);
  }
}
