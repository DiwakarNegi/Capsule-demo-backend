import { Paginate } from '@app/core/db/interfaces';
import { Categories } from '../entities';

interface CategoryResponse extends Partial<Categories> {
  message?: string;
}

export class TaxonomyTransformer {
  transform(response: CategoryResponse) {
    if ('message' in response) {
      return {
        message: response.message,
      };
    } else {
      return {
        id: response.uuid,
        name: response.name,
        createdAt: response.createdAt,
      };
    }
  }

  paginate({ data, meta }: Paginate<Categories>) {
    const transformedData = data.map((item) => this.transform(item));

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
}
