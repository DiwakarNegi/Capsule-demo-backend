import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminValidateOtpDto {
  @IsNotEmpty()
  @IsString()
  @Expose()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  otp: string;
}
