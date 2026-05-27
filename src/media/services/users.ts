import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { UserGetUploadUrlsDto } from '../dtos';
import { MediaResponse, MediaUrls } from '../transformers';
import { FilesService } from '@app/core/files/services';

@Injectable()
export class UserMediaService {
  constructor(private readonly files: FilesService) {}

  async getUploadUrls(payload: UserGetUploadUrlsDto): Promise<MediaResponse> {
    const urls: MediaUrls[] = [];
    for (let i = 0; i < payload.count; i++) {
      const key = `images/${randomUUID()}`;
      const url = await this.files.getUploadUrl(key);
      urls.push({ key, url });
    }
    return { urls };
  }
}
