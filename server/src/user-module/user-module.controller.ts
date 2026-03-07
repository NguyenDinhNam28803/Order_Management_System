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

@Controller('user-module')
export class UserModuleController {
  constructor(private readonly userModuleService: UserModuleService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.userModuleService.findById(req.user.sub);
  }

  @Post()
  create(@Body() createUserModuleDto: CreateUserModuleDto) {
    return this.userModuleService.create(createUserModuleDto);
  }

  @Get()
  findAll() {
    return this.userModuleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userModuleService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserModuleDto: UpdateUserModuleDto,
  ) {
    return this.userModuleService.update(+id, updateUserModuleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userModuleService.remove(+id);
  }
}
