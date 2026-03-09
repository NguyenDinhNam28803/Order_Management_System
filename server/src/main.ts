import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as pc from 'picocolors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // --- Cấu hình Swagger chi tiết ---
  const config = new DocumentBuilder()
    .setTitle('📦 Order Management System API')
    .setDescription(
      `
      ## 🚀 Hệ thống Quản lý Đơn hàng (OMS)
      Chào mừng bạn đến với tài liệu API chính thức của hệ thống OMS. 
      Tài liệu này cung cấp đầy đủ các điểm cuối (endpoints) để tương tác với hệ thống.

      ### 🔐 Xác thực & Bảo mật
      - **JWT Authorization**: Hầu hết các API yêu cầu Access Token.
      - Sử dụng nút **Authorize** bên dưới, nhập token theo định dạng: \`Bearer <your_token>\`.
      
      ### 🛠️ Các phân vùng chính
      - **Auth**: Quản lý đăng ký, đăng nhập và phân quyền.
      - **Users**: Quản lý thông tin người dùng và tổ chức.
      - **Orders**: Quy trình tạo và xử lý đơn hàng.
      - **Redis Cache**: Tối ưu hóa tốc độ truy xuất dữ liệu.

      ---
      *Hỗ trợ kỹ thuật: [admin@yourdomain.com](mailto:admin@yourdomain.com)*
      *Môi trường: **${configService.get<string>('NODE_ENV', 'development')}***
      `,
    )
    .setVersion('1.0')
    .setContact('OMS Support', 'https://yourwebsite.com', 'support@oms.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addTag('Auth', 'Xác thực người dùng và phân quyền')
    .addTag('Users', 'Quản lý thông tin tài khoản')
    .addTag('Orders', 'Xử lý logic đơn hàng')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Nhập token JWT của bạn',
        in: 'header',
      },
      'JWT-auth', // Tên key này sẽ dùng trong @ApiBearerAuth('JWT-auth') ở Controller
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, config);

  // Custom giao diện Swagger (Tùy chọn)
  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true, // Giữ login kể cả khi F5 trang
      docExpansion: 'none', // Thu gọn các tag mặc định
      filter: true, // Cho phép tìm kiếm API nhanh
    },
    customSiteTitle: 'OMS API Documentation',
  });

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  console.log('\n' + pc.bold(pc.cyan('🚀 SERVER STARTING UP...')));
  console.log(pc.gray('------------------------------------------'));
  console.log(
    `${pc.blue('🌍 Env        :')} ${pc.yellow(configService.get<string>('NODE_ENV', 'development'))}`,
  );
  console.log(`${pc.magenta('📡 Port       :')} ${pc.green(port.toString())}`);

  const dbStatus = configService.get<string>('DATABASE_URL')
    ? pc.green('✅ Connected')
    : pc.red('❌ Not Set');
  console.log(`${pc.cyan('🗄️  Database   :')} ${dbStatus}`);

  const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
  const redisPass = configService.get<string>('REDIS_PASSWORD')
    ? pc.green('🔒 Set')
    : pc.yellow('🔓 Not Set');
  console.log(
    `${pc.red('🔥 Redis      :')} ${pc.white(redisHost)} (${redisPass})`,
  );

  console.log(pc.gray('------------------------------------------'));
  console.log(
    `${pc.green('✔')} Swagger UI available at: ${pc.underline(pc.blue(`http://localhost:${port}/docs`))}`,
  );
  console.log(
    pc.bold(pc.bgGreen(pc.black(' DONE '))) + ' NestJS application is ready!\n',
  );
}

void bootstrap();
