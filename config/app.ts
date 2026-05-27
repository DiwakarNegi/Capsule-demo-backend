import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME!,
  port: Number(process.env.APP_PORT!),
  env: process.env.APP_ENV!,
  /** True only when APP_ENV=production — controls real SMS/email delivery. */
  isProduction: process.env.APP_ENV === 'production',
  debug: process.env.APP_DEBUG! === 'true' ? 1 : 0,
  url: process.env.APP_URL!,
  /** When true, OTP codes are randomly generated (recommended for production). */
  otpActive: process.env.ACTIVATE_OTP! === 'true',
  /** OTP validity and resend cooldown (seconds). */
  otpTtlSeconds: 300,
  otpLockTtlSeconds: 300,
  userDeleteionPrompt: process.env.USER_DELETION_PROMPT!,
  sysRoles: [
    {
      uuid: 'super',
      name: 'Super Admin',
    },
    {
      uuid: 'admin',
      name: 'Admin',
    },
    {
      uuid: 'vendor',
      name: 'Vendor',
    },
  ],
  superAdmin: {
    uuid: process.env.SUPER_ADMIN_UUID!,
    name: process.env.SUPER_ADMIN_NAME!,
    email: process.env.SUPER_ADMIN_EMAIL!,
    countryCode: process.env.SUPER_ADMIN_COUNTRY_CODE!,
    mobileNumber: process.env.SUPER_ADMIN_MOBILE_NUMBER!,
  },
  systemPromptKeys: {
    textGeneration: 'text-generation',
    imageGroupGeneration: 'image-group-generation',
    lifestyleImageGeneration: 'lifestyle-image-generation',
    lifestyleImageVariations: 'lifestyle-image-variations',
    marketplaceImageGeneration: 'marketplace-image-generation',
    marketplaceImageVariations: 'marketplace-image-variations',
    capsuleImageGeneration: 'capsule-image-generation',
    capsuleIntentAnalysis: 'capsule-intent-analysis',
  },
}));
