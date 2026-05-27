import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class AdminGetPromptsDto {
  @IsOptional()
  @IsString()
  @Expose()
  key: string;
}
