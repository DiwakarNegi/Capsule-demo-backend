import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdminUpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Expose()
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Expose()
  profilePicture: string;

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
