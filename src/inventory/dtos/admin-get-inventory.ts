import { Expose, Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class AdminGetInventoryDto {
  @IsOptional()
  @IsString()
  @Expose()
  query: string;

  @IsOptional()
  @Transform(({ value }) => Math.abs(+value > 0 ? +value - 1 : 0))
  @Expose()
  page: number;

  @IsOptional()
  @Transform(({ value }) => Math.abs(+value > 0 ? +value : 10))
  @Expose()
  perPage: number;

  @IsOptional()
  @IsString()
  @Expose()
  vendor: string;

  @IsOptional()
  @IsString()
  @Expose()
  brand: string;

  @IsOptional()
  @IsString()
  @Expose()
  category: string;
}
