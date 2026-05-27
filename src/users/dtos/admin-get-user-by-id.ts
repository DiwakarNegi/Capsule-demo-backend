import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminGetUserByIdDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;
}
