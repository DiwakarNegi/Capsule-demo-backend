import { Expose, Transform } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class UserGetBrandsDto {
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
}
