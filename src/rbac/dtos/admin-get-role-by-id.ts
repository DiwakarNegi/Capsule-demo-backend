import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class AdminGetRoleByIdDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;
}
