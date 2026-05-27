import { Expose } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
} from 'class-validator';

export class AdminCreateInventoryDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  title: string;

  @IsString()
  @IsOptional()
  @Expose()
  description?: string;

  @IsNumber()
  @Expose()
  price: number;

  @IsNumber()
  @Expose()
  stock: number;

  @IsString()
  @IsNotEmpty()
  @Expose()
  categoryId: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  brandId: string;

  @IsArray()
  @Expose()
  imageKeys: string[];
}
