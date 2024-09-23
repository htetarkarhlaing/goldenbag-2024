import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { TelegramService } from '../telegram.server.bot';

@Injectable()
export class TelegramNotiInterceptor<T> implements NestInterceptor<T> {
  constructor(private readonly telegramService: TelegramService) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<T> {
    const request: Request = context.switchToHttp().getRequest();
    const method: string = request.method;
    const url: string = request.url;

    return next.handle().pipe(
      tap(() => {
        const message = `Received ${method} request to ${url}`;
        this.telegramService.sendMessage(message);
      }),
    );
  }
}
