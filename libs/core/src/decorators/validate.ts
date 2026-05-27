import {
  createParamDecorator,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Type,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { Utilities } from '../utilities/utils';

type ReqShape = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  params?: Record<string, unknown>;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return x !== null && typeof x === 'object';
}

export const Validate = createParamDecorator(async function <T extends object>(
  dto: Type<T>,
  ctx: ExecutionContext,
): Promise<T> {
  const request = ctx.switchToHttp().getRequest<ReqShape>();

  const allParams: Record<string, unknown> = {
    ...(isRecord(request.query) ? request.query : {}),
    ...(isRecord(request.body) ? request.body : {}),
    ...(isRecord(request.params) ? request.params : {}),
  };

  const schema = plainToInstance(dto, allParams, {
    excludeExtraneousValues: true,
  });

  const errors: ValidationError[] = await validate(schema as object, {
    stopAtFirstError: true,
  });

  if (errors.length > 0) {
    const bag: Record<string, string[]> = {};
    for (const err of errors) {
      const parsed = Utilities.parseError(err);
      for (const [k, v] of Object.entries(parsed)) {
        if (Array.isArray(v) && v.length > 0) {
          bag[k] = v;
        }
      }
    }

    throw new HttpException({ errors: bag }, HttpStatus.UNPROCESSABLE_ENTITY);
  }

  return schema;
});
