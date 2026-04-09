import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserModuleDto } from './dto/create-user-module.dto';
import { UpdateUserModuleDto } from './dto/update-user-module.dto';
import Bcypt from 'bcrypt';

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
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
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

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateUserModuleDto) {
    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
