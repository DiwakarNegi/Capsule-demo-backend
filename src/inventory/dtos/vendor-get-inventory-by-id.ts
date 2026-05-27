import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class VendorGetInventoryByIdDto {
  @IsString()
  @IsNotEmpty()
  @Expose()
  id: string;
}
