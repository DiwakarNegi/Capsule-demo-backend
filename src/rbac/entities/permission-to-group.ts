import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PermissionGroups } from './permission-groups';
import { Permissions } from './permissions';

@Entity({ name: 'permission_to_group' })
@Index('UQ_permission_to_group_group_permission', ['group', 'permission'], {
  unique: true,
})
export class PermissionToGroup {
  @PrimaryGeneratedColumn()
  id: number;


  @ManyToOne(() => PermissionGroups, (group) => group.permissionToGroups, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  group: PermissionGroups;

  @ManyToOne(() => Permissions, (permission) => permission.permissionToGroups, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_id' })
  permission: Permissions;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
