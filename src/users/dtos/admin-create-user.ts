import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminCreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  countryCode: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  mobileNumber: string;
}
