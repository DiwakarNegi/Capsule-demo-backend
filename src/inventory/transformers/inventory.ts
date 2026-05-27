import { Injectable } from '@nestjs/common';
import { Paginate } from '@app/core/db/interfaces';
import { Inventory } from '../entities';
import { FilesService } from '@app/core/files/services';

interface InventoryResponse extends Partial<Inventory> {
  message?: string;
}

@Injectable()
export class InventoryTransformer {
  constructor(private readonly files: FilesService) {}

  async transform(item: InventoryResponse) {
    if ('message' in item) {
      return {
        message: item.message,
      };
    } else {
      return {
        id: item.uuid,
        title: item.title,
        description: item.description,
        generationStatus: item.generationStatus,
        price: item.price,
        stock: item.stock,
        brand: item.brand
          ? {
              id: item.brand.uuid,
              name: item.brand.name,
              featured: item.brand.featured,
            }
          : undefined,
        category: item.category
          ? {
              id: item.category.uuid,
              name: item.category.name,
            }
          : undefined,
        images: await this.transformImages(item.imageKeys),
        vendor: item.vendor
          ? {
              id: item.vendor.uuid,
              name: item.vendor.name,
            }
          : undefined,
        createdAt: item.createdAt,
      };
    }
  }

  async collection(data) {
    const result: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    for (const item of data) result.push(await this.transform(item));

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result;
  }

  async paginate({ data, meta }: Paginate<Inventory>) {
    const result: any[] = [];
    for (const item of data) result.push(await this.transform(item));

    return {
      data: result,
      meta: {
        ...meta,
        totalPages: Math.ceil(meta.total / meta.perPage),
      },
    };
  }

  async transformImages(keys?: string[]): Promise<any[]> {
    if (!keys) return [];
    const output: any[] = [];
    for (const key of keys) {
      const url = await this.files.getViewUrl(key);
      output.push({ key, url });
    }
    return output;
  }
}
