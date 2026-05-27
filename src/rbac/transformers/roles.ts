import { Paginate } from '@app/core/db/interfaces';
import { Roles } from '../entities';

interface UserResponse extends Partial<Roles> {
  message?: string;
}

export class RoleTransformer {
  transform(response: UserResponse) {
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

  paginate({ data, meta }: Paginate<Roles>) {
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
