import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class GetCapsulesDto {
  @IsOptional()
  @IsString()
  @Expose()
  vendorId?: string;

  @IsOptional()
  @IsString()
  @Expose()
  status?: 'pending' | 'completed' | 'failed';
}
