import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminDeleteTaxonomyDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;
}
