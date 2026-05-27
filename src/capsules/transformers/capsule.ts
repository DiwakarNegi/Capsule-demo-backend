import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Capsule } from '@app/src/capsules/entities';
import { CapsuleResponseDto, ImageUrlDto } from '@app/src/capsules/dtos';
import { FilesService } from '@app/core/files/services';

@Injectable()
export class CapsuleTransformer {
  constructor(private readonly filesService: FilesService) {}

  async transformCapsule(capsule: Capsule): Promise<CapsuleResponseDto> {
    const images: ImageUrlDto[] = [];
    const referenceImages: ImageUrlDto[] = [];

    // Transform generated images
    if (capsule.imageKeys && capsule.imageKeys.length > 0) {
      for (const key of capsule.imageKeys) {
        try {
          const url = await this.filesService.getViewUrl(key);
          images.push({
            key,
            url,
            mimeType: this.getMimeTypeFromKey(key),
          });
        } catch (err) {
          console.warn(`Failed to get view URL for image key: ${key}`, err);
        }
      }
    }

    // Transform reference images
    if (capsule.referenceImageKeys && capsule.referenceImageKeys.length > 0) {
      for (const key of capsule.referenceImageKeys) {
        try {
          const url = await this.filesService.getViewUrl(key);
          referenceImages.push({
            key,
            url,
            mimeType: this.getMimeTypeFromKey(key),
          });
        } catch (err) {
          console.warn(
            `Failed to get view URL for reference image key: ${key}`,
            err,
          );
        }
      }
    }

    const dto: CapsuleResponseDto = {
      id: capsule.id,
      uuid: capsule.uuid,
      prompt: capsule.prompt,
      images,
      referenceImages,
      status: capsule.status,
      errorMessage: capsule.errorMessage,
      vendorId: capsule.vendorId,
      createdAt: capsule.createdAt,
      updatedAt: capsule.updatedAt,
    };

    return plainToInstance(CapsuleResponseDto, dto, {
      excludeExtraneousValues: true,
    });
  }

  async transformCapsules(capsules: Capsule[]): Promise<CapsuleResponseDto[]> {
    return Promise.all(
      capsules.map((capsule) => this.transformCapsule(capsule)),
    );
  }

  private getMimeTypeFromKey(key: string): string {
    if (key.endsWith('.jpg') || key.endsWith('.jpeg')) {
      return 'image/jpeg';
    }
    if (key.endsWith('.png')) {
      return 'image/png';
    }
    if (key.endsWith('.webp')) {
      return 'image/webp';
    }
    return 'image/jpeg'; // default
  }
}
