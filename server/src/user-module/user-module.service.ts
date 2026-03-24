import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { CreateUserModuleDto } from './dto/create-user-module.dto';
import { UpdateUserModuleDto } from './dto/update-user-module.dto';
import { UserRepository } from './user.repository';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { NotificationModuleService } from '../notification-module/notification-module.service';

@Injectable()
export class UserModuleService {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly notificationService: NotificationModuleService,
  ) {}

  async create(createUserModuleDto: CreateUserModuleDto) {
    const user = await this.userRepository.create(createUserModuleDto);
    await this.cacheManager.del('user:all');

    // Gửi email thông báo tài khoản mới
    await this.notificationService.sendNotification({
      recipientId: user.id,
      eventType: 'NEW_USER_ACCOUNT',
      data: {
        username: user.email,
        password: createUserModuleDto.passwordHash, // Mật khẩu gốc từ DTO
      },
    });

    return user;
  }

  async findAll() {
    const cacheKey = 'user:all';
    const cachedData = await this.cacheManager.get<any[]>(cacheKey);
    if (cachedData) {
      console.log('--- Trả về dữ liệu từ REDIS (All Users) ---');
      return cachedData;
    }

    console.log('--- Truy vấn dữ liệu từ database (All Users) ---');
    const users = await this.userRepository.findAll();
    await this.cacheManager.set(cacheKey, users);
    return users;
  }

  async findOne(id: string) {
    const cacheKey = `user:${id}`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const cachedData = await this.cacheManager.get<any>(cacheKey);
    if (cachedData) {
      console.log(`--- Trả về dữ liệu từ REDIS (User ${id}) ---`);
      return cachedData;
    }

    console.log(`--- Truy vấn dữ liệu từ database (User ${id}) ---`);
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.cacheManager.set(cacheKey, user);
    return user;
  }

  async findByEmail(email: string) {
    const cacheKey = `user:email:${email}`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const cachedData = await this.cacheManager.get<any>(cacheKey);
    if (cachedData) {
      console.log(`--- Trả về dữ liệu từ REDIS (Email ${email}) ---`);
      return cachedData;
    }

    console.log(`--- Truy vấn dữ liệu từ database (Email ${email}) ---`);
    const user = await this.userRepository.findByEmail(email);
    if (user) {
      await this.cacheManager.set(cacheKey, user);
    }

    return user;
  }

  async update(id: string, updateUserModuleDto: UpdateUserModuleDto) {
    const user = await this.userRepository.update(id, updateUserModuleDto);
    await this.cacheManager.del('user:all');
    await this.cacheManager.del(`user:${id}`);
    if (user.email) {
      await this.cacheManager.del(`user:email:${user.email}`);
    }
    return user;
  }

  async remove(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.delete(id);
    await this.cacheManager.del('user:all');
    await this.cacheManager.del(`user:${id}`);
    await this.cacheManager.del(`user:email:${user.email}`);
    return { message: 'User deleted successfully' };
  }
}
