import { Expose } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class AdminUpdateBrandDto {
  @IsString()
  @Expose()
  id: string;

  @IsOptional()
  @IsString()
  @Expose()
  name: string;

  @IsOptional()
  @IsString()
  @Expose()
  thumbnail: string;

  @IsArray()
  @Expose()
  featured: Record<string, any>[];
}
