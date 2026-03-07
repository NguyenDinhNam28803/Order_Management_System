import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HashPasswordService } from '../hash-password/hash-password.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthModuleRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hashPasswordService: HashPasswordService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * CHỨC NĂNG ĐĂNG NHẬP:
   * 1. Tìm người dùng theo email.
   * 2. Kiểm tra mật khẩu (so sánh mã băm).
   * 3. Kiểm tra trạng thái tài khoản (isActive).
   * 4. Tạo bộ token xác thực (Access & Refresh Token).
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userInfo } = user;
    return {
      user: userInfo,
      ...tokens,
    };
  }

  /**
   * CHỨC NĂNG ĐĂNG KÝ:
   * 1. Kiểm tra email đã tồn tại hay chưa.
   * 2. Mã hóa mật khẩu người dùng.
   * 3. Lưu thông tin người dùng mới vào database (mặc định isActive=true).
   * 4. Xử lý lỗi trùng lặp dữ liệu từ Prisma (lỗi P2002).
   * 5. Tự động trả về token sau khi tạo tài khoản thành công.
   */
  async register(registerDto: RegisterDto) {
    const { password, ...userData } = registerDto;

    // Kiểm tra email tồn tại
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _, ...userInfo } = user;
      return {
        user: userInfo,
        ...tokens,
      };
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Email hoặc mã nhân viên đã tồn tại');
      }
      throw new InternalServerErrorException(
        'Đã xảy ra lỗi trong quá trình đăng ký',
      );
    }
  }

  /**
   * HÀM HỖ TRỢ TẠO TOKEN:
   * 1. Tạo JWT Payload chứa thông tin ID, Email, Vai trò, Tổ chức.
   * 2. Ký Access Token (hạn ngắn) và Refresh Token (hạn dài).
   * 3. Đóng gói bộ token trả về.
   */
  private async generateToken(user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    orgId: string;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN
          ? parseInt(process.env.JWT_EXPIRES_IN)
          : '15m',
      }),
      this.jwtService.signAsync(
        { sub: user.id },
        {
          secret: process.env.JWT_REFRESH_SECRET,
          expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
            ? parseInt(process.env.JWT_REFRESH_EXPIRES_IN)
            : '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
