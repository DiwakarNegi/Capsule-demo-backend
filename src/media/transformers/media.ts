import { Injectable } from '@nestjs/common';

export interface MediaUrls {
  key: string;
  url: string;
}

export interface MediaResponse {
  urls: MediaUrls[];
}

@Injectable()
export class MediaTransformer {
  constructor() {}
  transform(response: MediaResponse) {
    return {
      urls: response.urls,
    };
  }
}
