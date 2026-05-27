import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class AdminUpdateTaxonomyDto {
  @IsString()
  @Expose()
  id: string;

  @IsOptional()
  @IsString()
  @Expose()
  name: string;
}
