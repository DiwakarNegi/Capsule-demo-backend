import { Inject, Injectable } from '@nestjs/common';
import { ConfigType, getConfigToken } from '@nestjs/config';
import appConfig from '@config/app';
import { OTP_LOCK_TTL_SECONDS, OTP_TTL_SECONDS } from '../constants/otp.constants';

/**
 * Centralizes environment-driven OTP behaviour (dev console vs prod delivery).
 */
@Injectable()
export class OtpConfigService {
  constructor(
    @Inject(getConfigToken('app'))
    private readonly app: ConfigType<typeof appConfig>,
  ) {}

  get isProduction(): boolean {
    return !!this.app.isProduction;
  }

  get otpTtlSeconds(): number {
    return this.app.otpTtlSeconds ?? OTP_TTL_SECONDS;
  }

  get otpLockTtlSeconds(): number {
    return this.app.otpLockTtlSeconds ?? OTP_LOCK_TTL_SECONDS;
  }

  /** Production → MSG91/SMTP; local/development → console only. */
  shouldDeliverOtp(): boolean {
    return this.isProduction;
  }

  /** Random OTP in production or when ACTIVATE_OTP=true; else fixed dev code. */
  shouldGenerateRandomOtp(): boolean {
    return this.isProduction || !!this.app.otpActive;
  }
}
