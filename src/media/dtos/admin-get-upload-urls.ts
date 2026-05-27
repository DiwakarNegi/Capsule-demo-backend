import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AdminGetUploadUrlsDto {
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  count: number;

  @IsNotEmpty()
  @IsString()
  @Expose()
  path: string;
}
