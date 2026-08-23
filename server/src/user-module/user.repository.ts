import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserModuleDto } from './dto/create-user-module.dto';
import { UpdateUserModuleDto } from './dto/update-user-module.dto';
import Bcypt from 'bcrypt';
import {
  USER_SAFE_SELECT,
  USER_SAFE_SELECT_WITH_DEPT,
} from '../common/user-select';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserModuleDto) {
    // Hash the password before saving
    const hashedPassword = await Bcypt.hash(data.passwordHash, 10);
    return this.prisma.user.create({
      data: {
        ...data,
        passwordHash: hashedPassword,
      },
      select: USER_SAFE_SELECT,
    });
  }

  async profile(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        role: true,
        orgId: true,
        deptId: true,
        jobTitle: true,
        avatarUrl: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: USER_SAFE_SELECT_WITH_DEPT,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_SAFE_SELECT,
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
            companyType: true,
          },
        },
      },
    });
  }

  // Luồng xác thực dùng repository riêng của auth-module (vốn cần đọc
  // passwordHash), nên hàm này chỉ phục vụ tra cứu thông thường và trả bản
  // an toàn.
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: USER_SAFE_SELECT_WITH_DEPT,
    });
  }

  async update(id: string, data: UpdateUserModuleDto) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: USER_SAFE_SELECT_WITH_DEPT,
    });
  }

  async delete(id: string) {
    return this.prisma.user.delete({
      where: { id },
      select: USER_SAFE_SELECT,
    });
  }
}
