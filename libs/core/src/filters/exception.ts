import {
  Catch,
  ArgumentsHost,
  ExceptionFilter as EF,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object';
}

type ErrorResponseBase = { success: boolean; message: string };
type ErrorResponse422 = ErrorResponseBase & { errors: unknown };

@Catch()
export class ExceptionFilter implements EF {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    console.error('HttpException:\n\n', exception);

    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const httpStatus: HttpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const buildMessage = (): string => {
      if (httpStatus === HttpStatus.UNPROCESSABLE_ENTITY) {
        return 'Invalid input, please check and resubmit the form';
      }
      if (exception instanceof HttpException) {
        const resp = exception.getResponse();
        if (typeof resp === 'string') return resp;
        if (isRecord(resp) && 'message' in resp) {
          const m = resp.message;
          return Array.isArray(m) ? m.map(String).join(', ') : String(m);
        }
        return exception.message;
      }
      if (exception instanceof Error) return exception.message;
      return 'Internal server error';
    };

    const extractFormErrors = (): unknown => {
      if (!(exception instanceof HttpException)) return undefined;
      const resp = exception.getResponse();
      if (!isRecord(resp)) return undefined;

      if ('errors' in resp) {
        return resp.errors;
      }
      if (Array.isArray(resp.message)) {
        return resp.message;
      }
      if (typeof resp.message === 'string') {
        return [resp.message];
      }
      return undefined;
    };

    const message = buildMessage();

    const responseBody: ErrorResponseBase | ErrorResponse422 =
      httpStatus === HttpStatus.UNPROCESSABLE_ENTITY
        ? {
            success: false,
            message,
            errors: extractFormErrors(),
          }
        : {
            success: false,
            message,
          };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
