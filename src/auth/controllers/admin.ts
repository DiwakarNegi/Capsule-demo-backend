import { Controller, Post } from '@nestjs/common';
import { AdminOtpDto, AdminValidateOtpDto } from '../dtos';
import { Validate } from '@app/core/decorators';
import { AuthAdminService } from '../services';
import { AuthTransformer } from '../transformers';

@Controller({
  path: 'auth/admin',
  version: '1',
})
export class AuthAdminController {
  constructor(
    private readonly service: AuthAdminService,
    private readonly transformer: AuthTransformer,
  ) {}

  @Post('send-otp')
  async sendOtp(@Validate(AdminOtpDto) payload: AdminOtpDto) {
    await this.service.sendOtp(payload);
    return this.transformer.transform({ message: 'OTP sent' });
  }

  /** Spec endpoint — primary verify route. */
  @Post('verify-otp')
  async verifyOtp(
    @Validate(AdminValidateOtpDto) payload: AdminValidateOtpDto,
  ) {
    const response = await this.service.verifyOtp(payload);
    return this.transformer.transform(response);
  }

  /** Backward-compatible alias for existing clients. */
  @Post('validate-otp')
  async validateOtp(
    @Validate(AdminValidateOtpDto) payload: AdminValidateOtpDto,
  ) {
    const response = await this.service.validateOtp(payload);
    return this.transformer.transform(response);
  }

  @Post('resend-otp')
  async resendOtp(@Validate(AdminOtpDto) payload: AdminOtpDto) {
    await this.service.resendOtp(payload);
    return this.transformer.transform({ message: 'OTP sent' });
  }
}
