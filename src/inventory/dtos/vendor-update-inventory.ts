import { Expose } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class VendorUpdateInventoryDto {
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
  @IsOptional()
  @Expose()
  category?: string;

  @IsString()
  @IsOptional()
  @Expose()
  brand?: string;

  @IsArray()
  @IsOptional()
  @Expose()
  imageKeys?: string[];
}
