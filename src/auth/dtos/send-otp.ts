import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class SendOtpDto {
  @IsNotEmpty()
  @IsString()
  @Expose()
  countryCode: string;

  @IsNotEmpty()
  @IsString()
  @Expose()
  mobileNumber: string;
}
