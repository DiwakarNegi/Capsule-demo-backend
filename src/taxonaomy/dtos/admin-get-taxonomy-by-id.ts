import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminGetTaxonomyDetailsDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;
}
