import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type ApiResponse<T> = { success: true; data: T };

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept<T>(
    _: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    return next
      .handle()
      .pipe(map((data: T): ApiResponse<T> => ({ success: true, data })));
  }
}
