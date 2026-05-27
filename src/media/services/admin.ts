import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AdminGetUploadUrlsDto } from '../dtos';
import { MediaResponse, MediaUrls } from '../transformers';
import { FilesService } from '@app/core/files/services';

@Injectable()
export class AdminMediaService {
  constructor(private readonly files: FilesService) {}

  async getUploadUrls(payload: AdminGetUploadUrlsDto): Promise<MediaResponse> {
    const urls: MediaUrls[] = [];
    for (let i = 0; i < payload.count; i++) {
      const key = `${payload.path}/${randomUUID()}`;
      const url = await this.files.getUploadUrl(key);
      urls.push({ key, url });
    }
    return { urls };
  }
}
