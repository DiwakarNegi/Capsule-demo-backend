import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PermissionToGroup } from './permission-to-group';
import { UserPermissions } from './user-permissions';

@Entity({ name: 'permissions' })
export class Permissions {
  @PrimaryGeneratedColumn()
  id: number;



  @Column({ unique: true })
  name: string; // e.g. "service:create"

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => PermissionToGroup, (m) => m.permission)
  permissionToGroups: PermissionToGroup[];

  @OneToMany(() => UserPermissions, (m) => m.permission)
  userPermissions: UserPermissions[];
}
