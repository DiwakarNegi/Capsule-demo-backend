import { Expose } from 'class-transformer';
import { IsArray, IsString, IsNotEmpty } from 'class-validator';

export class ProcessCapsuleDto {
  /*
  @IsArray()
  @Expose()
  imageKeys: string[];

  @IsString()
  @IsNotEmpty()
  @Expose()
  supportingText: string;
  */

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  @Expose()
  imageKeys: string[];

  @IsString()
  @IsNotEmpty()
  @Expose()
  supportingText: string;
}
