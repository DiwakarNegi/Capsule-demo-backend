import { Controller, Post } from '@nestjs/common';
import { AuthUserService } from '../services';
import { Validate } from '@app/core/decorators';
import { SendOtpDto, ValidateOtpDto } from '../dtos';
import { AuthTransformer } from '../transformers';

@Controller({
  path: 'auth/user',
  version: '1',
})
export class AuthUserController {
  constructor(
    private readonly service: AuthUserService,
    private readonly transformer: AuthTransformer,
  ) {}

  @Post('send-otp')
  async sendOtp(@Validate(SendOtpDto) payload: SendOtpDto) {
    await this.service.sendOtp(payload);
    return this.transformer.transform({ message: 'OTP sent' });
  }

  /** Spec endpoint — primary verify route. */
  @Post('verify-otp')
  async verifyOtp(@Validate(ValidateOtpDto) payload: ValidateOtpDto) {
    const response = await this.service.verifyOtp(payload);
    return this.transformer.transform(response);
  }

  /** Backward-compatible alias for existing clients. */
  @Post('validate-otp')
  async validateOtp(@Validate(ValidateOtpDto) payload: ValidateOtpDto) {
    const response = await this.service.validateOtp(payload);
    return this.transformer.transform(response);
  }

  @Post('resend-otp')
  async resendOtp(@Validate(SendOtpDto) payload: SendOtpDto) {
    await this.service.resendOtp(payload);
    return this.transformer.transform({ message: 'OTP sent' });
  }
}
