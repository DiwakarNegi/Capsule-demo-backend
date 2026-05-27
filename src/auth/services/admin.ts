import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminOtpDto, AdminValidateOtpDto } from '../dtos';
import { AdminsRepository } from '@app/src/users/repositories';
import { Admins } from '@app/src/users/entities';
import { JwtService } from '@nestjs/jwt';
import type { AuthPrincipalType } from '@app/core/guards/types';
import { normalizeAdminEmail } from '../utils/normalize-email';
import { OtpDeliveryService } from './otp-delivery.service';
import { OtpRedisService } from './otp-redis.service';

@Injectable()
export class AuthAdminService {
  private readonly logger = new Logger(AuthAdminService.name);

  constructor(
    private readonly admins: AdminsRepository,
    private readonly jwt: JwtService,
    private readonly otpRedis: OtpRedisService,
    private readonly otpDelivery: OtpDeliveryService,
  ) {}

  // ---------------------------------------------------------------------------
  // REPLACED: Inline Redis/mailer + UsersRepository + role checks at login.
  // Admin OTP is email-based, `admins` table only, keys otp:admin:<email>.
  // ---------------------------------------------------------------------------

  async sendOtp(payload: AdminOtpDto): Promise<void> {
    const email = normalizeAdminEmail(payload.email);
    const admin = await this.findActiveAdmin(email);
    const otp = this.otpDelivery.generateCode();

    await this.otpRedis.storeAdminOtp(email, otp);
    await this.otpDelivery.deliverAdminOtp(email, otp);
  }

  /** Primary verify handler (spec: POST verify-otp). */
  async verifyOtp(
    payload: AdminValidateOtpDto,
  ): Promise<Record<string, unknown>> {
    return this.validateOtp(payload);
  }

  /** @deprecated Route alias — prefer verifyOtp / POST verify-otp */
  async validateOtp(
    payload: AdminValidateOtpDto,
  ): Promise<Record<string, unknown>> {
    const email = normalizeAdminEmail(payload.email);
    const admin = await this.findAdminForVerify(email);

    await this.otpRedis.verifyAdminOtp(email, payload.otp);

    const toSign = this.buildAdminJwtPayload(admin);
    this.logger.log(`Admin authenticated uuid=${admin.uuid}`);

    return {
      tokens: {
        accessToken: this.jwt.sign(toSign),
        refreshToken: null,
      },
      admin,
    };
  }

  async resendOtp(payload: AdminOtpDto): Promise<void> {
    const email = normalizeAdminEmail(payload.email);
    await this.findAdminForVerify(email);

    await this.otpRedis.assertAdminResendAllowed(email);
    await this.otpRedis.clearAdminLock(email);

    const otp = this.otpDelivery.generateCode();
    await this.otpRedis.storeAdminOtp(email, otp);
    await this.otpDelivery.deliverAdminOtp(email, otp);
  }

  private async findActiveAdmin(email: string): Promise<Admins> {
    const admin = await this.admins.findOne({
      where: { email, isActive: true },
    });
    if (!admin) {
      this.logger.warn('Admin OTP denied — unknown or inactive email');
      throw new UnauthorizedException('Invalid credentials');
    }
    return admin;
  }

  private async findAdminForVerify(email: string): Promise<Admins> {
    const admin = await this.admins.findOne({
      where: { email, isActive: true },
    });
    if (!admin) {
      throw new HttpException(
        'Not able to complete verification, try again.',
        HttpStatus.BAD_REQUEST,
      );
    }
    return admin;
  }

  private buildAdminJwtPayload(admin: Admins): {
    sub: string;
    username: string;
    type: AuthPrincipalType;
  } {
    return {
      sub: admin.uuid,
      type: 'admin',
      username: admin.name ?? admin.email ?? admin.uuid,
    };
  }
}
