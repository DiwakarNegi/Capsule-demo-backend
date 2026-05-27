import { Expose } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class VendorCreateInventoryDto {
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
  @IsOptional()
  @Expose()
  imageKeys?: string[];
}
