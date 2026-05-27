import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdminUpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Expose()
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Expose()
  email: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Expose()
  countryCode: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Expose()
  mobileNumber: string;
}
