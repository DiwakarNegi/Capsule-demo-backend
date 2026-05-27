import { registerAs } from '@nestjs/config';

export default registerAs('sms', () => ({
  baseUrl: process.env.MSG91_HOST!,
  authKey: process.env.MSG91_AUTHKEY!,
  templateId: process.env.MSG91_TEMPLATE_ID!,
}));
