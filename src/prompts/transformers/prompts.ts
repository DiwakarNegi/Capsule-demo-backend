import { Prompts } from '../entities';
import { Injectable } from '@nestjs/common';

interface PromptsResponse extends Partial<Prompts> {
  message?: string;
}

@Injectable()
export class PromptsTransformer {
  transform(response: PromptsResponse) {
    if ('message' in response) {
      return {
        message: response.message,
      };
    } else {
      return {
        id: response.promptKey,
        title: response.promptTitle,
        value: response.promptValue,
        createdAt: response.createdAt,
      };
    }
  }

  collection(data: Array<Prompts>) {
    const transformedData: any[] = [];

    for (const item of data) {
      transformedData.push(this.transform(item));
    }

    return {
      data: transformedData,
    };
  }
}
