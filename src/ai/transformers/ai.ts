import { FilesService } from '@app/core/files/services';
import { Injectable } from '@nestjs/common';

interface UserResponse extends Partial<Record<string, any>> {
  message?: string;
}

@Injectable()
export class AiTransformer {
  constructor(private readonly files: FilesService) {}
  transform(response: UserResponse) {
    if ('message' in response) {
      return {
        message: response.message,
      };
    } else {
      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: response.content,
      };
    }
  }
}
