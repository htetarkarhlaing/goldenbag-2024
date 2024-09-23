import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from './Response.interceptor';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';
    const devMessage =
      exception instanceof HttpException &&
      typeof exception.getResponse === 'function'
        ? exception.getResponse()
        : String(exception);

    const errorResponse: ApiResponse<null> = {
      meta: {
        success: false,
        message,
        devMessage: JSON.stringify(devMessage),
      },
      body: null,
    };

    response.status(status).json(errorResponse);
  }
}
