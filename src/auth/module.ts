import { Module } from '@nestjs/common';
import {
  AuthAdminService,
  AuthUserService,
  OtpConfigService,
  OtpDeliveryService,
  OtpRedisService,
} from './services';
import { AuthAdminController, AuthUserController } from './controllers';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admins, Users } from '../users/entities';
import { AuthTransformer } from './transformers';
import { AdminsRepository } from '../users/repositories';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: { expiresIn: configService.get('jwt.ttl') },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Users, Admins]),
  ],
  // AdminsRepository also provided globally via UsersModule; registered here for AuthAdminService DI clarity.
  providers: [
    JwtStrategy,
    OtpConfigService,
    OtpRedisService,
    OtpDeliveryService,
    AuthAdminService,
    AuthUserService,
    AuthTransformer,
    AdminsRepository,
  ],
  controllers: [AuthAdminController, AuthUserController],
})
export class AuthModule {}
