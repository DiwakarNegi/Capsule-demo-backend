import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Users } from '@app/src/users/entities';

@Entity('capsules')
export class Capsule {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated('uuid')
  uuid: string;

  @Column({ type: 'text' })
  prompt: string;

  @Column({ type: 'simple-json', nullable: true })
  imageKeys: string[];

  @Column({ type: 'simple-json', nullable: true })
  referenceImageKeys: string[];

  @Column({ type: 'simple-json', nullable: true })
  usedInventoryIds: number[];

  @ManyToOne(() => Users, (user) => user.uuid)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Users;

  @Column()
  vendorId: number;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
