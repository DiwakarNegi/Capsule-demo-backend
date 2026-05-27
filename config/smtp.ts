import { registerAs } from '@nestjs/config';

export default registerAs('smtp', () => ({
  host: process.env.SMTP_HOST!,
  username: process.env.SMTP_USERNAME!,
  password: process.env.SMTP_PASSWORD!,
  sender: process.env.SMTP_SENDER!,
}));
