import { Injectable } from '@nestjs/common';
import { FilesService } from '@app/core/files/services';
import { Admins } from '../entities/admins';

interface AdminResponse extends Partial<Admins> {
  message?: string;
}

@Injectable()
export class AdminTransformer {
  constructor(private readonly files: FilesService) {}

  async transform(response: AdminResponse) {
    if ('message' in response) {
      return { message: response.message };
    }

    return {
      id: response.uuid,
      name: response.name,
      email: response.email,
      countryCode: response.countryCode,
      mobileNumber: response.mobileNumber,
      profilePicture: await this.transformS3Key(response.profilePicture),
      createdAt: response.createdAt,
    };
  }

  private async transformS3Key(key: string | undefined) {
    if (!key) return undefined;
    const signedUrl = await this.files.getViewUrl(key);
    return { key, url: signedUrl };
  }
}
