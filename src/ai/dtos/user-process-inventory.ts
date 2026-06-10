import { Expose } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UserProcessInventoryDto {
  /*
  @IsArray()
  @Expose()
  imageKeys: string[];

  @IsString()
  @IsOptional()
  @Expose()
  supportingText: string;

  @IsString()
  @Expose()
  @IsIn(['lifestyle', 'marketplace'])
  commerceCategory: string;
  */

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  @Expose()
  imageKeys: string[];

  @IsString()
  @IsOptional()
  @Expose()
  supportingText: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @IsIn(['lifestyle', 'marketplace'])
  commerceCategory: string;

  @IsNumber()
  @IsOptional()
  @Expose()
  productWidth?: number;

  @IsNumber()
  @IsOptional()
  @Expose()
  productLength?: number;

  @IsString()
  @IsOptional()
  @Expose()
  @IsIn(['cm', 'inch'])
  productDimensionUnit?: string;
}
