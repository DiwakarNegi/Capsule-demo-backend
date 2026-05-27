import { registerAs } from '@nestjs/config';

export default registerAs('files', () => ({
  region: process.env.AWS_REGION!,
  bucket: process.env.AWS_BUCKET!,
  accessKeyId: process.env.AWS_KEY_ID!,
  secretAccessKey: process.env.AWS_KEY_SECRET!,
}));
