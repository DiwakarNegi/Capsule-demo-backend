import { Expose } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
} from 'class-validator';

export class AdminUpdateInventoryDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;

  @IsString()
  @IsOptional()
  @Expose()
  title: string;

  @IsString()
  @IsOptional()
  @Expose()
  description: string;

  @IsNumber()
  @IsOptional()
  @Expose()
  price: number;

  @IsNumber()
  @IsOptional()
  @Expose()
  stock: number;

  @IsString()
  @IsOptional()
  @Expose()
  categoryId: string;

  @IsString()
  @IsOptional()
  @Expose()
  brandId: string;

  @IsArray()
  @IsOptional()
  @Expose()
  imageKeys?: string[];
}
