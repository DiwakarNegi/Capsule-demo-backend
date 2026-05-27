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
import { Categories } from '@app/src/taxonaomy/entities';
import { Brands } from '@app/src/brands/entities';

@Entity()
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated('uuid')
  uuid: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('float')
  price: number;

  @Column('int')
  stock: number;

  @ManyToOne(() => Categories, (category) => category.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category: Categories;

  @Column()
  categoryId: number;

  @ManyToOne(() => Brands, (brand) => brand.products, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'brand_id' })
  brand: Brands;

  @Column()
  brandId: number;

  @Column('simple-array', { nullable: true })
  imageKeys: string[];

  @ManyToOne(() => Users, (user) => user.uuid)
  vendor: Users;

  @Column()
  vendorId: number;

  @Column({ type: 'text', default: "'Image Generation Pending" })
  generationStatus: string;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;
}
