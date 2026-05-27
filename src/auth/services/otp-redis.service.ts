import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { RedisService } from '@app/core/services';
import { OTP_REDIS } from '../constants/otp.constants';
import { OtpConfigService } from './otp-config.service';

export type OtpPrincipal = 'user' | 'admin';

@Injectable()
export class OtpRedisService {
  private readonly logger = new Logger(OtpRedisService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly otpConfig: OtpConfigService,
  ) {}

  async storeUserOtp(mobile: string, otp: string): Promise<void> {
    const ttl = this.otpConfig.otpTtlSeconds;
    const lockTtl = this.otpConfig.otpLockTtlSeconds;
    // REPLACED: otp:user:<username> → otp:user:<mobile> e.g. +919876543210
    // OLD: await this.redis.set(`otp:user:${username}`, otp, 300);
    await this.redis.set(OTP_REDIS.userOtp(mobile), otp, ttl);
    await this.redis.set(OTP_REDIS.userLock(mobile), '1', lockTtl);
    this.logger.debug(`Stored user OTP key=${OTP_REDIS.userOtp(mobile)} ttl=${ttl}s`);
  }

  async storeAdminOtp(email: string, otp: string): Promise<void> {
    const ttl = this.otpConfig.otpTtlSeconds;
    const lockTtl = this.otpConfig.otpLockTtlSeconds;
    await this.redis.set(OTP_REDIS.adminOtp(email), otp, ttl);
    await this.redis.set(OTP_REDIS.adminLock(email), '1', lockTtl);
    this.logger.debug(`Stored admin OTP key=${OTP_REDIS.adminOtp(email)} ttl=${ttl}s`);
  }

  async verifyUserOtp(mobile: string, submittedOtp: string): Promise<void> {
    await this.verifyOtp(OTP_REDIS.userOtp(mobile), submittedOtp, 'user');
    await this.redis.delete(OTP_REDIS.userOtp(mobile));
  }

  async verifyAdminOtp(email: string, submittedOtp: string): Promise<void> {
    await this.verifyOtp(OTP_REDIS.adminOtp(email), submittedOtp, 'admin');
    await this.redis.delete(OTP_REDIS.adminOtp(email));
  }

  async assertUserResendAllowed(mobile: string): Promise<void> {
    await this.assertResendAllowed(OTP_REDIS.userLock(mobile));
  }

  async assertAdminResendAllowed(email: string): Promise<void> {
    await this.assertResendAllowed(OTP_REDIS.adminLock(email));
  }

  /** Clears lock so a new OTP can be sent after cooldown policy. */
  async clearUserLock(mobile: string): Promise<void> {
    await this.redis.delete(OTP_REDIS.userLock(mobile));
  }

  async clearAdminLock(email: string): Promise<void> {
    await this.redis.delete(OTP_REDIS.adminLock(email));
  }

  private async verifyOtp(
    key: string,
    submittedOtp: string,
    principal: OtpPrincipal,
  ): Promise<void> {
    const stored = await this.redis.get(key);
    if (!stored) {
      this.logger.warn(`OTP missing or expired principal=${principal} key=${key}`);
      throw new HttpException(
        'OTP is invalid or has expired, try again.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (submittedOtp !== stored) {
      this.logger.warn(`OTP mismatch principal=${principal} key=${key}`);
      throw new HttpException(
        'Invalid OTP, try again.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async assertResendAllowed(lockKey: string): Promise<void> {
    const isLock = await this.redis.get(lockKey);
    if (isLock) {
      throw new HttpException(
        'Please wait for 5 minutes before requesting the OTP again.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
