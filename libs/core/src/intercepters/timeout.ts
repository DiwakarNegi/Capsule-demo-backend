import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from '@nestjs/common';
import { Observable, throwError, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators'; // if you currently import from 'rxjs', that's fine too

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      timeout(5000),
      catchError((err: unknown) => {
        console.log(err);
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException());
        }
        if (err instanceof Error) {
          return throwError(() => err);
        }
        const message = typeof err === 'string' ? err : 'Unknown error';
        return throwError(() => new Error(message));
      }),
    );
  }
}
