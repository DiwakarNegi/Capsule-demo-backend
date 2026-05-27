import { Global, Module } from '@nestjs/common';
import { AdminUserController, UserController } from './controllers';
import { AdminUserService, UserService } from './services';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminsRepository, UsersRepository } from './repositories';
import { Admins, Users } from './entities';
import { AdminTransformer, UserTransformer } from './transformers';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Users, Admins])],
  controllers: [UserController, AdminUserController],
  providers: [
    UserService,
    AdminUserService,
    UsersRepository,
    AdminsRepository,
    UserTransformer,
    AdminTransformer,
  ],
  exports: [
    UsersRepository,
    AdminsRepository,
    UserTransformer,
    AdminTransformer,
  ],
})
export class UsersModule {}
