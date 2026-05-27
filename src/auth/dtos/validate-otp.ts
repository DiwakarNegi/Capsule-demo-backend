import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateOtpDto {
  @IsNotEmpty()
  @IsString()
  @Expose()
  countryCode: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  mobileNumber: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  otp: string;
}
