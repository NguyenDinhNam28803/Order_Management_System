import { PrismaClient } from '@prisma/client';
export class UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}
