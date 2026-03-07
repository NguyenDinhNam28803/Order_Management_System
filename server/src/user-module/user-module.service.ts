import { Injectable, Inject } from '@nestjs/common';
import { CreateUserModuleDto } from './dto/create-user-module.dto';
import { UpdateUserModuleDto } from './dto/update-user-module.dto';
import { UserRepository } from './user.repository';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
@Injectable()
export class UserModuleService {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  create(createUserModuleDto: CreateUserModuleDto) {
    return `This action adds a new userModule: ${JSON.stringify(createUserModuleDto)}`;
  }

  findAll() {
    return `This action returns all userModule`;
  }

  async findById(id: string) {
    const cacheKey = `user:${id}`;
    const cachedData = await this.cacheManager.get<any>(cacheKey);
    if (cachedData) {
      console.log('--- Trả về dữ liệu từ REDIS ---');
      return cachedData;
    }
    console.log('--- Truy vấn dữ liệu từ database ---');
    const user = await this.userRepository.findById(id);
    await this.cacheManager.set(cacheKey, user);
    return user;
  }

  findOne(id: number) {
    return `This action returns a #${id} userModule`;
  }

  update(id: number, updateUserModuleDto: UpdateUserModuleDto) {
    return `This action updates a #${id} userModule: ${JSON.stringify(updateUserModuleDto)}`;
  }

  remove(id: number) {
    return `This action removes a #${id} userModule`;
  }
}
