import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class AdminUpdatePromptDto {
  @IsString()
  @Expose()
  key: string;

  @IsString()
  @Expose()
  value: string;
}
