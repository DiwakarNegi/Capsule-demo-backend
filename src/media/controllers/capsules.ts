import { Controller, Get } from '@nestjs/common';
import { CapsulesMediaService } from '../services';
import { MediaTransformer } from '../transformers';

@Controller({
  path: 'capsules/media',
  version: '1',
})
export class MediaCapsulesController {
  constructor(
    private readonly service: CapsulesMediaService,
    private readonly transformer: MediaTransformer,
  ) {}

  @Get('urls')
  async getUploadUrls() {
    const response = await this.service.getUploadUrls();
    return this.transformer.transform(response);
  }
}
