import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { useContainer } from 'class-validator';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ExceptionFilter } from '@app/core/filters';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import { ResponseInterceptor, TimeoutInterceptor } from '@app/core/intercepters';
import { CacheService } from '@app/core/cache';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: 50 * 1024 * 1024,
      trustProxy: true,
    }),
  );

  // Allow binary content types for file uploads
  app.getHttpAdapter().getInstance().addContentTypeParser(
    ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/octet-stream'],
    { parseAs: 'buffer' },
    function(_req: any, body: any, done: any) {
      done(null, body);
    }
  );
  // Catch-all for any other content type (e.g. image/heic, video/*, no Content-Type).
  // Fastify's built-in application/json parser takes precedence over '*'.
  app.getHttpAdapter().getInstance().addContentTypeParser(
    '*',
    { parseAs: 'buffer' },
    function(_req: any, body: any, done: any) {
      done(null, body);
    }
  );

  await app.register(fastifyCors as any, {
    origin: ['http://localhost:3001'],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
  });

  await app.register(fastifyHelmet as any, {
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  const redisSvc = app.get(CacheService);
  const redis = redisSvc.client;

  await app.register(fastifyRateLimit as any, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1'],
    keyGenerator: (req: any) => req.user?.sub ?? req.ip,
    redis,
    nameSpace: 'ratelimit:',
    skipOnError: true,
  });

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.useGlobalInterceptors(new TimeoutInterceptor());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      disableErrorMessages: false,
      stopAtFirstError: true,
      transformOptions: { excludeExtraneousValues: true },
    }),
  );

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new ExceptionFilter(httpAdapter));

  const config = app.get(ConfigService);
  await app.listen({ port: config.get('app.port'), host: '0.0.0.0' });
}

void bootstrap();