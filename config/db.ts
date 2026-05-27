import { registerAs } from '@nestjs/config';

export default registerAs('db', () => ({
  type: process.env.DB_TYPE!,
  host: process.env.DB_HOST!,
  port: process.env.DB_PORT!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  name: process.env.DB_NAME!,
}));
