import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Không tìm thấy token xác thực');
    }
    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      // Gán payload vào request để sử dụng sau này
      request['user'] = payload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException(
          'Token đã hết hạn, vui lòng đăng nhập lại',
        );
      }
      throw new UnauthorizedException('Xác thực không thành công');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const authorization = request.headers.authorization;
    if (!authorization) return undefined;
    const [type, token] = authorization.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
