import { Injectable, Logger } from '@nestjs/common';
import { SmtpService } from '@app/core/services';
import { Msg91Service } from '@app/core/services/msg91';
import { Utilities } from '@app/core/utilities';
import { OtpConfigService } from './otp-config.service';

/**
 * Delivers OTPs via the correct channel per principal and environment.
 * - Non-production: console.log only (no SMS/email).
 * - Production: MSG91 (user) / SMTP (admin).
 */
@Injectable()
export class OtpDeliveryService {
  private readonly logger = new Logger(OtpDeliveryService.name);

  constructor(
    private readonly otpConfig: OtpConfigService,
    private readonly mailer: SmtpService,
    private readonly sms: Msg91Service,
  ) {}

  generateCode(): string {
    return this.otpConfig.shouldGenerateRandomOtp()
      ? Utilities.generateOtp(6)
      : '123456';
  }

  async deliverUserOtp(mobile: string, otp: string): Promise<void> {
    if (!this.otpConfig.shouldDeliverOtp()) {
      // Development: never send SMS — log clearly for local testing.
      console.log(`[OTP-DEV] User ${mobile} → ${otp}`);
      return;
    }

    // Production: MSG91 (extensible — swap provider by changing this service).
    const mobiles = mobile.replace(/^\+/, '');
    try {
      await this.sms.send({
        recipients: [{ mobiles, otp }],
      });
      this.logger.log(`User OTP SMS sent via MSG91 mobile=${mobile}`);
    } catch (err) {
      this.logger.error(
        `User OTP SMS failed mobile=${mobile}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw err;
    }
  }

  async deliverAdminOtp(email: string, otp: string): Promise<void> {
    if (!this.otpConfig.shouldDeliverOtp()) {
      console.log(`[OTP-DEV] Admin ${email} → ${otp}`);
      return;
    }

    try {
      await this.mailer.send(email, {
        subject: 'Your OTP for login',
        html: `<span>Hi, Please use the following to login. OTP is valid for 5 minutes only.</span><br /><br /><span>${otp}</span>`,
      });
      this.logger.log(`Admin OTP email queued for ${email}`);
    } catch (err) {
      this.logger.error(
        `Admin OTP email failed for ${email}`,
        err instanceof Error ? err.stack : String(err),
      );
      throw err;
    }
  }
}
