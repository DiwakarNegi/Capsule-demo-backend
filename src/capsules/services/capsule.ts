import { Injectable } from '@nestjs/common';
import { CapsuleRepository } from '../repositories';
import { CapsuleTransformer } from '../transformers';
import { CapsuleResponseDto } from '../dtos';

@Injectable()
export class CapsuleService {
  constructor(
    private readonly capsuleRepo: CapsuleRepository,
    private readonly transformer: CapsuleTransformer,
  ) {}

  async getCapsulesByVendor(
    vendorId: number,
    limit: number = 20,
  ): Promise<CapsuleResponseDto[]> {
    const capsules = await this.capsuleRepo.findByVendor(vendorId, limit);
    return this.transformer.transformCapsules(capsules);
  }

  async getCapsulesByStatus(
    status: 'pending' | 'completed' | 'failed',
    limit: number = 20,
  ): Promise<CapsuleResponseDto[]> {
    const capsules = await this.capsuleRepo.findByStatus(status, limit);
    return this.transformer.transformCapsules(capsules);
  }

  async getCapsuleById(id: number): Promise<CapsuleResponseDto> {
    const capsule = await this.capsuleRepo.findOneOrFail({ where: { id } });
    return this.transformer.transformCapsule(capsule);
  }

  async getCapsuleByUuid(uuid: string): Promise<CapsuleResponseDto> {
    const capsule = await this.capsuleRepo.findOneOrFail({ where: { uuid } });
    return this.transformer.transformCapsule(capsule);
  }
}
