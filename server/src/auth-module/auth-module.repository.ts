import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HashPasswordService } from '../hash-password/hash-password.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: Omit<User, 'passwordHash' | 'hashedRefreshToken'>;
}

@Injectable()
export class AuthModuleRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashPasswordService: HashPasswordService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * CHỨC NĂNG ĐĂNG NHẬP:
   * 1. Tìm người dùng theo email.
   * 2. Kiểm tra mật khẩu (so sánh mã băm).
   * 3. Kiểm tra trạng thái tài khoản (isActive).
   * 4. Tạo bộ token xác thực (Access & Refresh Token).
   * 5. Lưu hash của Refresh Token vào database.
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        department: true,
        organization: true,
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isPasswordValid = await this.hashPasswordService.comparePassword(
      password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa');
    }

    const tokens = await this.generateToken(user);
    await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, hashedRefreshToken, ...userInfo } = user;
    return {
      user: userInfo,
      ...tokens,
    };
  }

  /**
   * CHỨC NĂNG ĐĂNG KÝ:
   * 1. Kiểm tra email đã tồn tại hay chưa.
   * 2. Mã hóa mật khẩu người dùng.
   * 3. Lưu thông tin người dùng mới vào database.
   * 4. Tạo token và lưu hash refresh token.
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { password, ...userData } = registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    try {
      const passwordHash =
        await this.hashPasswordService.hashPassword(password);

      const user = await this.prisma.user.create({
        data: {
          ...userData,
          passwordHash,
          isActive: true,
          isVerified: false,
        },
      });

      const tokens = await this.generateToken(user);
      await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

      const { passwordHash: _, hashedRefreshToken: __, ...userInfo } = user;
      return {
        user: userInfo,
        ...tokens,
      };
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email hoặc mã nhân viên đã tồn tại');
      }
      throw new InternalServerErrorException(
        'Đã xảy ra lỗi trong quá trình đăng ký',
      );
    }
  }

  /**
   * ĐĂNG XUẤT:
   * Xóa hashedRefreshToken trong database.
   */
  async logout(userId: string) {
    await this.prisma.user.updateMany({
      where: {
        id: userId,
        hashedRefreshToken: {
          not: null,
        },
      },
      data: {
        hashedRefreshToken: null,
      },
    });
    return { message: 'Đăng xuất thành công' };
  }

  /**
   * REFRESH TOKEN:
   * 1. Xác thực token gửi lên.
   * 2. Tìm user.
   * 3. So sánh token gửi lên với hash trong DB.
   * 4. Nếu khớp -> Cấp phát token mới và cập nhật hash mới.
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const decoded = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub as string },
      });

      if (!user || !user.hashedRefreshToken) {
        throw new ForbiddenException('Access Denied');
      }

      const refreshTokenMatches = await bcrypt.compare(
        refreshToken,
        user.hashedRefreshToken,
      );

      if (!refreshTokenMatches) {
        throw new ForbiddenException('Access Denied');
      }

      const tokens = await this.generateToken(user);
      await this.updateRefreshTokenHash(user.id, tokens.refreshToken);

      return tokens;
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'TokenExpiredError'
      ) {
        throw new UnauthorizedException(
          'Refresh Token đã hết hạn, vui lòng đăng nhập lại',
        );
      }
      throw new ForbiddenException('Refresh Token không hợp lệ');
    }
  }

  /**
   * Validate Access Token
   */
  async validateToken(token: string): Promise<any> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const decoded = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      return decoded;
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'TokenExpiredError'
      ) {
        throw new UnauthorizedException('Token đã hết hạn');
      }
      throw new UnauthorizedException('Token không hợp lệ');
    }
  }

  // --- HELPERS ---

  private async generateToken(user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    orgId: string;
  }): Promise<AuthTokens> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expiresIn: this.configService.get<string>(
          'JWT_EXPIRES_IN',
          '15m',
        ) as any,
      }),
      this.jwtService.signAsync(
        { sub: user.id },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          expiresIn: this.configService.get<string>(
            'JWT_REFRESH_EXPIRES_IN',
            '7d',
          ) as any,
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        hashedRefreshToken: hash,
      },
    });
  }
}
