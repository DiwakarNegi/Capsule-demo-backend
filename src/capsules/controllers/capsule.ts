import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { CapsuleService } from '../services';
import { CapsuleResponseDto } from '../dtos';

@Controller({
  path: 'capsules',
  version: '1',
})
export class CapsuleController {
  constructor(private readonly service: CapsuleService) {}

  @Get('vendor/:vendorId')
  async getCapsulesByVendor(
    @Param('vendorId') vendorId: string,
    @Query('limit') limit: string = '20',
  ): Promise<CapsuleResponseDto[]> {
    const vId = parseInt(vendorId);
    if (isNaN(vId)) {
      throw new BadRequestException('Invalid vendorId');
    }

    return this.service.getCapsulesByVendor(vId, parseInt(limit) || 20);
  }

  @Get('status/:status')
  async getCapsulesByStatus(
    @Param('status') status: 'pending' | 'completed' | 'failed',
    @Query('limit') limit: string = '20',
  ): Promise<CapsuleResponseDto[]> {
    return this.service.getCapsulesByStatus(status, parseInt(limit) || 20);
  }

  @Get(':uuid')
  async getCapsuleByUuid(
    @Param('uuid') uuid: string,
  ): Promise<CapsuleResponseDto> {
    return this.service.getCapsuleByUuid(uuid);
  }
}
