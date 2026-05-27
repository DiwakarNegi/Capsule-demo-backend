import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { PermissionToGroup } from './permission-to-group';

@Entity({ name: 'permission_groups' })
export class PermissionGroups {
  @PrimaryGeneratedColumn()
  id: number;



  @Column()
  name: string; // SUPER_ADMIN, VENDOR, CUSTOMER

  @OneToMany(() => PermissionToGroup, (m) => m.group)
  permissionToGroups: PermissionToGroup[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
