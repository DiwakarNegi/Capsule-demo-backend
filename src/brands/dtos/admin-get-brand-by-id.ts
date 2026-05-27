import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminGetBrandDetailsDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;
}
