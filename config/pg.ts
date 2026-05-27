import { registerAs } from '@nestjs/config';

export default registerAs('pg', () => ({
  razorPay: {
    keyId: process.env.RAZOR_PAY_KEY_ID!,
    keySecret: process.env.RAZOR_PAY_KEY_SECRET!,
  },
  appleIap: {
    secret: process.env.APPLE_IAP_SHARED_SECRET!,
    environment: [process.env.APPLE_IAP_ENVIRONMENT!],
  },
}));
