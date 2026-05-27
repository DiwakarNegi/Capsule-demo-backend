import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminGenerateDto {
  @IsNotEmpty()
  @IsString()
  @Expose()
  id: string;
}
