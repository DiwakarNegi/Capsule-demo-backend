import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminDeleteBrandDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;
}
