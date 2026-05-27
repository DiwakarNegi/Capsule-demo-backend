import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  gemini: {
    apiKey: process.env.GEMINI_API_KEY!,
    textModel: process.env.GEMINI_MODEL_TEXT!,
    imageModel: process.env.GEMINI_MODEL_NANO_BANANA!,
  },
}));
