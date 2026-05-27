import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import config from 'config';
import * as joi from 'joi';
import { MailService } from './mailer';
import { Msg91Service, RedisService, SmtpService } from './services';
import { CacheService } from './cache';
import { configValidation } from './utilities/config-validations';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: config,
      validationSchema: joi.object(configValidation),
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
    }),
    HttpModule,
  ],
  providers: [MailService, SmtpService, CacheService, RedisService, Msg91Service],
  exports: [SmtpService, RedisService, CacheService, Msg91Service],
})
export class CoreModule {}
