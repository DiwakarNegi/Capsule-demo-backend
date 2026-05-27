import { Users } from '@app/src/users/entities';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { Roles } from './roles';

@Entity()
@Index('UQ_user_role_idx', ['user', 'role'], { unique: true }) // DB-level: no duplicate pairs
export class UserRoleMappings {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('IDX_urm_user_id')
  @ManyToOne(() => Users, (u) => u.userRoleMappings, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' }) // binds to the existing FK column
  user: Users;

  @Index('IDX_urm_role_id')
  @ManyToOne(() => Roles, (r) => r.userRoleMappings, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role: Roles;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
