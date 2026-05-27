import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminCreateTaxonomyDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  name: string;
}
