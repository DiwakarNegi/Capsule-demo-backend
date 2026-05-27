import { Expose, Type } from 'class-transformer';

export class ImageUrlDto {
  @Expose()
  key: string;

  @Expose()
  url: string;

  @Expose()
  mimeType?: string;
}

export class CapsuleResponseDto {
  @Expose()
  id: number;

  @Expose()
  uuid: string;

  @Expose()
  prompt: string;

  @Expose()
  @Type(() => ImageUrlDto)
  images: ImageUrlDto[];

  @Expose()
  @Type(() => ImageUrlDto)
  referenceImages: ImageUrlDto[];

  @Expose()
  status: string;

  @Expose()
  errorMessage?: string;

  @Expose()
  vendorId: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
