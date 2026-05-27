import { Controller, Post } from '@nestjs/common';
import { AdminGetUploadUrlsDto } from '../dtos';
import { Allow, Validate } from '@app/core/decorators';
import { AdminMediaService } from '../services';
import { MediaTransformer } from '../transformers';

@Controller({
  path: 'admins/media',
  version: '1',
})
export class MediaAdminController {
  constructor(
    private readonly service: AdminMediaService,
    private readonly transformer: MediaTransformer,
  ) {}

  @Allow(["media:getUploadUrls"])
  @Post('urls')
  async getUploadUrls(
    @Validate(AdminGetUploadUrlsDto) payload: AdminGetUploadUrlsDto,
  ) {
    const response = await this.service.getUploadUrls(payload);
    return this.transformer.transform(response);
  }
}
