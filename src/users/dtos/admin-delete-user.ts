import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminDeleteUserDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;
}
