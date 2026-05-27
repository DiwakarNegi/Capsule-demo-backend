import { Paginate } from '@app/core/db/interfaces';
import { Brands } from '../entities';
import { FilesService } from '@app/core/files/services';
import { Injectable } from '@nestjs/common';

interface BrandsResponse extends Partial<Brands> {
  message?: string;
}

@Injectable()
export class BrandsTransformer {
  constructor(private readonly files: FilesService) {}
  async transform(response: BrandsResponse) {
    if ('message' in response) {
      return {
        message: response.message,
      };
    } else {
      return {
        id: response.uuid,
        name: response.name,
        thumbnail: await this.transformS3Key(response.thumbnail),
        featured: response.featured,
        createdAt: response.createdAt,
      };
    }
  }

  async paginate({ data, meta }: Paginate<Brands>) {
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
