import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { MediaResponse, MediaUrls } from '../transformers';
import { FilesService } from '@app/core/files/services';

@Injectable()
export class CapsulesMediaService {
  constructor(private readonly files: FilesService) {}

  async getUploadUrls(): Promise<MediaResponse> {
    const urls: MediaUrls[] = [];
    const key = `capsules/${randomUUID()}`;
    const url = await this.files.getUploadUrl(key);
    urls.push({ key, url });
    return { urls };
  }
}
