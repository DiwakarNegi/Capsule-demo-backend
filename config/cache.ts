import { registerAs } from '@nestjs/config';

export default registerAs('cache', () => ({
  host: process.env.CACHE_HOST!,
  port: Number(process.env.CACHE_PORT!),
  username: process.env.CACHE_USERNAME!,
  password: process.env.CACHE_PASSWORD!,
  db: Number(process.env.CACHE_SENDER!),
  keyPrefix: process.env.CACHE_PREFIX!,
}));
