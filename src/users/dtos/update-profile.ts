import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Expose()
  name: string;

  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  @Expose()
  email: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Expose()
  profilePicture: string;
}
