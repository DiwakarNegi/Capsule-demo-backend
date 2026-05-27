import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class UserGetUploadUrlsDto {
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  count: number;
}
