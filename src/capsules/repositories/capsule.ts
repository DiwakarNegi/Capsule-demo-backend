import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Capsule } from '../entities';

@Injectable()
export class CapsuleRepository extends Repository<Capsule> {
  constructor(private dataSource: DataSource) {
    super(Capsule, dataSource.createEntityManager());
  }

  async createAndSave(data: Partial<Capsule>): Promise<Capsule> {
    const capsule = this.create(data);
    return this.save(capsule);
  }

  async findByVendor(vendorId: number, limit: number = 10): Promise<Capsule[]> {
    if (isNaN(vendorId)) {
      return [];
    }

    return this.find({
      where: { vendorId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findByStatus(
    status: 'pending' | 'completed' | 'failed',
    limit: number = 10,
  ): Promise<Capsule[]> {
    return this.find({
      where: { status },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
