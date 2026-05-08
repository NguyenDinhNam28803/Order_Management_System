import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
    );
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Xử lý message từ NestJS mặc định (thường là object)
    const errorBody = typeof message === 'object' ? message : { message };
    let stack: string | null = null;

    if (exception instanceof Error) {
      stack = exception.stack ?? null;
    }

    response.status(status).json({
      status: 'failed',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      message: errorBody['message'] || 'An error occurred',
      data: {
        statusCode: status,
        timestamp: new Date().toISOString(),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        path: request.url,
        ...(process.env.NODE_ENV !== 'production' ? { stack } : {}),
      },
    });
  }
}
