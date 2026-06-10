import * as joi from 'joi';

const appValidation = {
  APP_NAME: joi.string().default('sirhaana-services'),
  APP_PORT: joi.number().port().default(6000),
  APP_ENV: joi
    .string()
    .valid('local', 'development', 'production')
    .default('local'),
  APP_DEBUG: joi
    .boolean()
    .truthy('1', 'true', 1)
    .falsy('0', 'false', 0)
    .default(true),
  APP_URL: joi
    .string()
    .uri({ scheme: ['http', 'https'] })
    .default('http://localhost:6000'),
  ACTIVATE_OTP: joi
    .boolean()
    .truthy('1', 'true', 1)
    .falsy('0', 'false', 0)
    .default(false),
  USER_DELETION_PROMPT: joi.string().required(),
};

const cacheValidation = {
  CACHE_HOST: joi.string().hostname().required(),
  CACHE_PORT: joi.number().port().default(6379),
  CACHE_USERNAME: joi.string().allow('').default(''),
  CACHE_PASSWORD: joi.string().allow('').default(''),
  CACHE_SENDER: joi.number().integer().min(0).default(0),
  CACHE_PREFIX: joi.string().allow('').default(''),
};

const dbValidation = {
  DB_TYPE: joi.string().valid('mysql').default('mysql'),
  DB_HOST: joi.string().hostname().default('localhost'),
  DB_PORT: joi.number().port().default(3306),
  DB_USER: joi.string().default('root'),
  DB_PASSWORD: joi.string().default('db-password'),
  DB_NAME: joi.string().default('db-name'),
};

const jwtValidation = {
  JWT_SECRET: joi.string().min(12).default('super-secure-secret'),
  JWT_TTL: joi
    .string()
    .pattern(/^\d+[smhd]?$|^\d+$/)
    .default('1h'),
};

const smtpValidation = {
  SMTP_HOST: joi.string().hostname().required(),
  SMTP_USERNAME: joi.string().required(),
  SMTP_PASSWORD: joi.string().min(6).required(),
  SMTP_SENDER: joi.string().email().required(),
};

const superUserValidation = {
  SUPER_ADMIN_UUID: joi.string().required(),
  SUPER_ADMIN_NAME: joi.string().required(),
  SUPER_ADMIN_EMAIL: joi.string().required(),
  SUPER_ADMIN_COUNTRY_CODE: joi.string().required(),
  SUPER_ADMIN_MOBILE_NUMBER: joi.string().required(),
};

const filesValidation = {
  AWS_REGION: joi.string().required(),
  AWS_BUCKET: joi.string().required(),
  AWS_KEY_ID: joi.string().required(),
  AWS_KEY_SECRET: joi.string().required(),
};

const smsValidation = {
  MSG91_HOST: joi.string().required(),
  MSG91_AUTHKEY: joi.string().required(),
  MSG91_TEMPLATE_ID: joi.string().required(),
};

const aiValidation = {
  GEMINI_API_KEY: joi.string().allow('').default(''),
  GEMINI_MODEL_TEXT: joi.string().required(),
  GEMINI_MODEL_NANO_BANANA: joi.string().required(),
  GOOGLE_CLOUD_PROJECT: joi.string().required(),
};

export const configValidation = {
  ...appValidation,
  ...cacheValidation,
  ...dbValidation,
  ...jwtValidation,
  ...smtpValidation,
  ...superUserValidation,
  ...filesValidation,
  ...smsValidation,
  ...aiValidation,
};
