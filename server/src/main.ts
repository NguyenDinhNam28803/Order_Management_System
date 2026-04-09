import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as pc from 'picocolors';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // --- Global Security & Validation ---
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ các field không có trong DTO
      transform: true, // Tự động chuyển đổi kiểu dữ liệu
      forbidNonWhitelisted: true, // Báo lỗi nếu gửi field thừa
    }),
  );

  // --- Global Interceptors & Filters ---
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // --- Cấu hình Swagger chi tiết ---
  const config = new DocumentBuilder()
    .setTitle('📦 Hệ thống Quản lý Mua sắm & Đơn hàng (OMS)')
    .setDescription(
      `
      ## 🚀 Giới thiệu hệ thống
      Chào mừng bạn đến với tài liệu API chính thức của hệ thống **Order Management System (OMS)**. 
      Hệ thống được thiết kế để chuẩn hóa và tự động hóa toàn bộ quy trình từ yêu cầu mua sắm đến thanh toán (**Procure-to-Pay**).

      ### 🛠️ Các module cốt lõi
      - **PR & PO**: Quản lý Yêu cầu mua hàng (Purchase Requisition) và Đơn mua hàng (Purchase Order).
      - **Sourcing & RFQ**: Quy trình tìm kiếm nhà cung cấp, gửi yêu cầu báo giá và so sánh giá.
      - **GRN & Matching**: Nhập kho (Goods Receipt Note) và đối soát 3 chiều (PO - GRN - Invoice).
      - **Approvals**: Hệ thống phê duyệt đa cấp linh hoạt cho mọi loại chứng từ.
      - **Budget & Cost Center**: Kiểm soát ngân sách và quản lý trung tâm chi phí.
      - **Invoicing & Payments**: Quản lý hóa đơn và quy trình thanh toán cho nhà cung cấp.
      - **AI Service**: Tích hợp trí tuệ nhân tạo để tối ưu hóa tìm kiếm và gợi ý nhà cung cấp.

      ### 🔐 Xác thực & Bảo mật
      - **JWT Authorization**: Hệ thống sử dụng cơ chế JWT để bảo mật các điểm cuối.
      - **RBAC**: Phân quyền dựa trên vai trò (Admin, Procurement, Requestor, Approver, Supplier).
      - Nhấn nút **Authorize** bên dưới, nhập token theo định dạng: \`Bearer <your_token>\`.

      ### 📄 Quy chuẩn API
      - **Định dạng dữ liệu**: Luôn sử dụng \`application/json\`.
      - **Cấu trúc phản hồi**: \`{ success, data, message, statusCode, timestamp }\`.

      ---
      *Môi trường: **${configService.get<string>('NODE_ENV', 'development')}***
      *Hỗ trợ kỹ thuật: [admin@oms-system.com](mailto:admin@oms-system.com)*
      `,
    )
    .setVersion('1.0')
    .setContact(
      'OMS Development Team',
      'https://oms-internal.com',
      'dev@oms.com',
    )
    .setLicense('MIT License', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Nhập Access Token của bạn để truy cập các API bảo mật',
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

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://procuresmart.io.vn:3000/',
    ], // Đảm bảo khớp với URL của client
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Quan trọng: Cho phép gửi/nhận cookie
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
  const redisPass =
    configService.get<string>('REDIS_PORT') &&
    configService.get<string>('REDIS_HOST')
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
