import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateUserModuleDto } from './dto/create-user-module.dto';
import { UpdateUserModuleDto } from './dto/update-user-module.dto';
import { UserRepository } from './user.repository';
import { NotificationModuleService } from '../notification-module/notification-module.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDelegationDto } from './dto/user-delegation.dto';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';

@Injectable()
export class UserModuleService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly prisma: PrismaService,
    // @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly notificationService: NotificationModuleService,
  ) {}

  // User Management
  async create(createUserModuleDto: CreateUserModuleDto) {
    // 1. Nếu không có mật khẩu được cung cấp, tạo một mật khẩu ngẫu nhiên cực mạnh
    if (!createUserModuleDto.passwordHash) {
      createUserModuleDto.passwordHash =
        Math.random().toString(36).slice(-12) +
        Math.random().toString(36).toUpperCase().slice(-12);
    }

    // 2. Tạo User trong DB (Mật khẩu sẽ được hash trong repository)
    const user = await this.userRepository.create(createUserModuleDto);
    // await this.cacheManager.del('user:all');

    // 3. Tạo một Setup Token đơn giản (Trong thực tế nên lưu vào DB với thời hạn)
    const setupToken = Buffer.from(`${user.id}:${Date.now()}`).toString(
      'base64',
    );

    // 4. Gửi email chào mừng (KHÔNG gửi mật khẩu)
    await this.notificationService.sendNotification({
      recipientId: user.id,
      eventType: 'NEW_USER_ACCOUNT',
      data: {
        username: user.email,
        fullName: user.fullName,
        setupLink: `https://procurement-app.com/setup-password?token=${setupToken}`,
        note: 'Vì lý do bảo mật, mật khẩu không được gửi qua email. Vui lòng nhấn vào link để thiết lập mật khẩu lần đầu.',
      },
    });

    return user;
  }

  // ... (findAll, findOne, update, remove remain unchanged)

  async findAll() {
    console.log('--- Truy vấn dữ liệu từ database (All Users) ---');
    const users = await this.userRepository.findAll();
    // await this.cacheManager.set(cacheKey, users);
    return users;
  }

  async findOne(id: string) {
    console.log(`--- Truy vấn dữ liệu từ database (User ${id}) ---`);
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // await this.cacheManager.set(cacheKey, user);
    return user;
  }

  async findByEmail(email: string) {
    console.log(`--- Truy vấn dữ liệu từ database (Email ${email}) ---`);
    const user = await this.userRepository.findByEmail(email);
    // if (user) {
    //   await this.cacheManager.set(cacheKey, user);
    // }

    return user;
  }

  async update(id: string, updateUserModuleDto: UpdateUserModuleDto) {
    const user = await this.userRepository.update(id, updateUserModuleDto);
    // await this.cacheManager.del('user:all');
    // await this.cacheManager.del(`user:${id}`);
    // if (user.email) {
    //   await this.cacheManager.del(`user:email:${user.email}`);
    // }
    return user;
  }

  async remove(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.delete(id);
    // await this.cacheManager.del('user:all');
    // await this.cacheManager.del(`user:${id}`);
    // await this.cacheManager.del(`user:email:${user.email}`);
    return { message: 'User deleted successfully' };
  }

  // --- Delegation Logic ---

  /**
   * Tạo một ủy quyền mới
   */
  async createDelegation(dto: CreateUserDelegationDto, user: JwtPayload) {
    // 1. Kiểm tra người được ủy quyền có tồn tại không
    const delegate = await this.prisma.user.findUnique({
      where: { id: dto.delegateId },
    });

    if (!delegate) {
      throw new NotFoundException('Người được ủy quyền không tồn tại.');
    }

    if (dto.delegateId === user.sub) {
      throw new BadRequestException(
        'Bạn không thể tự ủy quyền cho chính mình.',
      );
    }

    // 2. Kiểm tra thời gian hợp lệ
    const validFrom = new Date(dto.validFrom);
    const validUntil = new Date(dto.validUntil);

    if (validUntil <= validFrom) {
      throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu.');
    }

    // 3. Tạo bản ghi ủy quyền
    return this.prisma.userDelegate.create({
      data: {
        ...dto,
        delegatorId: user.sub,
        validFrom,
        validUntil,
      },
      include: {
        delegate: { select: { fullName: true, email: true } },
      },
    });
  }

  /**
   * Lấy danh sách các ủy quyền tôi đã tạo
   */
  async findMyDelegations(userId: string) {
    return this.prisma.userDelegate.findMany({
      where: { delegatorId: userId },
      include: {
        delegate: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Bật/Tắt ủy quyền
   */
  async toggleDelegation(id: string, userId: string, isActive: boolean) {
    const delegation = await this.prisma.userDelegate.findUnique({
      where: { id },
    });

    if (!delegation || delegation.delegatorId !== userId) {
      throw new NotFoundException('Không tìm thấy bản ghi ủy quyền của bạn.');
    }

    return this.prisma.userDelegate.update({
      where: { id },
      data: { isActive },
    });
  }

  /**
   * Tìm người đang được ủy quyền thay thế (Hệ thống gọi)
   */
  async getActiveDelegate(delegatorId: string): Promise<string | null> {
    const now = new Date();
    const activeDelegation = await this.prisma.userDelegate.findFirst({
      where: {
        delegatorId,
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      select: { delegateId: true },
    });

    return activeDelegation?.delegateId || null;
  }
}
