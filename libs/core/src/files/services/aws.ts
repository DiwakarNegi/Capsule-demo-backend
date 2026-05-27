import { Inject, Injectable } from '@nestjs/common';
import { FILES_MODULE_OPTIONS } from '../constants';
import { S3Config } from '../interfaces';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
  private uploadDir: string;
  private baseUrl: string;

  constructor(@Inject(FILES_MODULE_OPTIONS) private options: S3Config) {
    this.uploadDir = path.resolve(process.cwd(), 'uploads');
    this.baseUrl = process.env.APP_URL || 'http://localhost:3000';
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async getUploadUrl(fileName: string): Promise<string> {
    return this.baseUrl + '/v1/media/upload/' + encodeURIComponent(fileName);
  }

  async getViewUrl(fileName: string): Promise<string> {
    return this.baseUrl + '/v1/media/file/' + encodeURIComponent(fileName);
  }

  async putFile(fileName: string, data: string, mimeType: string): Promise<void> {
    const safeName = fileName.replace(/\//g, '_');
    const filePath = path.resolve(this.uploadDir, safeName);
    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
  }

  getLocalPath(fileName: string): string {
    return path.resolve(this.uploadDir, fileName.replace(/\//g, '_'));
  }
}