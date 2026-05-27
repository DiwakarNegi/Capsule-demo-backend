import { Paginate } from '@app/core/db/interfaces';
import { Users } from '../entities';
import { FilesService } from '@app/core/files/services';
import { Injectable } from '@nestjs/common';

interface UserResponse extends Partial<Users> {
  message?: string;
}

@Injectable()
export class UserTransformer {
  constructor(private readonly files: FilesService) {}
  async transform(response: UserResponse) {
    if ('message' in response) {
      return {
        message: response.message,
      };
    } else {
      return {
        id: response.uuid,
        name: response.name,
        username: response.username,
        email: response.email,
        countryCode: response.countryCode,
        mobileNumber: response.mobileNumber,
        profilePicture: await this.transformS3Key(response.profilePicture),
        createdAt: response.createdAt,
        role:
          response.userRoleMappings && response.userRoleMappings[0].role.name,
      };
    }
  }

  async paginate({ data, meta }: Paginate<Users>) {
    const transformedData: any[] = [];

    for (const item of data) {
      transformedData.push(await this.transform(item));
    }

    return {
      data: transformedData,
      meta: {
        page: meta.page,
        perPage: meta.perPage,
        total: meta.total,
        totalPages: Math.ceil(meta.total / meta.perPage),
      },
    };
  }

  async transformS3Key(key: string | undefined) {
    if (!key) return undefined;
    const signedUrl = await this.files.getViewUrl(key);
    return {
      key,
      url: signedUrl,
    };
  }
}
