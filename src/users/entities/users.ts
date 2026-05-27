import { UserRoleMappings } from '@app/src/rbac/entities/user-role-mappings';
import { UserPermissions } from '@app/src/rbac/entities/user-permissions';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
} from 'typeorm';

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated('uuid')
  uuid: string;

  @Column({ nullable: true })
  name: string;

  @Column()
  countryCode: string;

  @Column()
  mobileNumber: string;

  @Column({
    type: 'varchar',
    unique: true,
  })
  username: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  profilePicture: string;

  @CreateDateColumn()
  createdAt: string;

  @UpdateDateColumn()
  updatedAt: string;

  @BeforeInsert()
  @BeforeUpdate()
  private setUsername(): void {
    this.username = `${this.countryCode.trim()}${this.mobileNumber.replace(/\s+/g, '')}`;
  }

  @OneToMany(() => UserRoleMappings, (m) => m.user)
  userRoleMappings: UserRoleMappings[];

  @OneToMany(() => UserPermissions, (m) => m.user)
  userPermissions: UserPermissions[];
}
