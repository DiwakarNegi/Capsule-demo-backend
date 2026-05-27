import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  MethodNotAllowedException,
} from '@nestjs/common';
import { SendOtpDto, ValidateOtpDto } from '../dtos';
import { JwtService } from '@nestjs/jwt';
import { UsersRepository } from '@app/src/users/repositories';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Roles,
  UserRoleMappings,
  Permissions,
  UserPermissions,
} from '@app/src/rbac/entities';
import { Users } from '@app/src/users/entities';
import { Brands } from '@app/src/brands/entities';
import type { AuthPrincipalType } from '@app/core/guards/types';
import {
  formatUserMobileKey,
  formatUserUsername,
} from '../utils/mobile-key';
import { OtpDeliveryService } from './otp-delivery.service';
import { OtpRedisService } from './otp-redis.service';

const VENDOR_DEFAULT_PERMISSIONS = [
  'inventory:read',
  'inventory:create',
  'media:getUploadUrls',
  'user:getProfile',
  'user:updateProfile',
  'user:deleteProfile',
] as const;

@Injectable()
export class AuthUserService {
  private readonly logger = new Logger(AuthUserService.name);

  constructor(
    private readonly users: UsersRepository,
    private readonly jwt: JwtService,
    private readonly otpRedis: OtpRedisService,
    private readonly otpDelivery: OtpDeliveryService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async sendOtp(payload: SendOtpDto): Promise<void> {
    const mobile = formatUserMobileKey(
      payload.countryCode,
      payload.mobileNumber,
    );
    const username = formatUserUsername(
      payload.countryCode,
      payload.mobileNumber,
    );

    await this.resolveVendorUser(payload, username);
    const otp = this.otpDelivery.generateCode();

    // REPLACED: otp:user:<username> → otp:user:<mobile> e.g. +919876543210
    // OLD: await this.redis.set(`otp:user:${user.username}`, otp, 300);
    await this.otpRedis.storeUserOtp(mobile, otp);
    await this.otpDelivery.deliverUserOtp(mobile, otp);
  }

  /** Primary verify handler (spec: POST verify-otp). */
  async verifyOtp(payload: ValidateOtpDto): Promise<Record<string, unknown>> {
    return this.validateOtp(payload);
  }

  /** @deprecated Route alias — prefer verifyOtp / POST verify-otp */
  async validateOtp(payload: ValidateOtpDto): Promise<Record<string, unknown>> {
    const mobile = formatUserMobileKey(
      payload.countryCode,
      payload.mobileNumber,
    );
    const username = formatUserUsername(
      payload.countryCode,
      payload.mobileNumber,
    );

    const user = await this.users.findOne({ where: { username } });
    if (!user) {
      throw new HttpException(
        'Not able to complete verification, try again.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // REPLACED: Redis lookup by mobile key, not username
    // OLD: const otp = await this.redis.get(`otp:user:${user.username}`);
    await this.otpRedis.verifyUserOtp(mobile, payload.otp);

    const toSign = {
      sub: user.uuid,
      type: 'user' as AuthPrincipalType,
      username: user.username,
    };

    this.logger.log(`User authenticated uuid=${user.uuid}`);

    return {
      tokens: {
        accessToken: this.jwt.sign(toSign),
        refreshToken: null,
      },
      user,
    };
  }

  async resendOtp(payload: SendOtpDto): Promise<void> {
    const mobile = formatUserMobileKey(
      payload.countryCode,
      payload.mobileNumber,
    );
    const username = formatUserUsername(
      payload.countryCode,
      payload.mobileNumber,
    );

    const user = await this.users.findOne({ where: { username } });
    if (!user) {
      throw new HttpException(
        'Not able to resend OTP, try again.',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.otpRedis.assertUserResendAllowed(mobile);
    await this.otpRedis.clearUserLock(mobile);

    const otp = this.otpDelivery.generateCode();
    await this.otpRedis.storeUserOtp(mobile, otp);
    await this.otpDelivery.deliverUserOtp(mobile, otp);
  }

  private async resolveVendorUser(
    payload: SendOtpDto,
    username: string,
  ): Promise<Users> {
    const allowedRoles = ['vendor'];
    let user = await this.users.findOne({
      where: { username },
      relations: ['userRoleMappings.role'],
    });

    if (!user) {
      user = await this.registerVendor(payload, username);
    }

    const userRoles = (user.userRoleMappings ?? [])
      .map((m) => m?.role?.uuid)
      .filter((r): r is string => typeof r === 'string' && r.length > 0);
    const hasAllowedRole = userRoles.some((r) => allowedRoles.includes(r));
    if (!hasAllowedRole) throw new MethodNotAllowedException();

    return user;
  }

  private async registerVendor(
    payload: SendOtpDto,
    username: string,
  ): Promise<Users> {
    let created!: Users;

    await this.dataSource.transaction(async (manager) => {
      const userRepo: Repository<Users> = manager.getRepository(Users);
      const rolesRepo: Repository<Roles> = manager.getRepository(Roles);
      const brandsRepo: Repository<Brands> = manager.getRepository(Brands);
      const userRoleRepo: Repository<UserRoleMappings> =
        manager.getRepository(UserRoleMappings);

      let user = userRepo.create({
        countryCode: payload.countryCode,
        mobileNumber: payload.mobileNumber,
      });
      user = await userRepo.save(user);

      const role = await rolesRepo.findOneOrFail({
        where: { uuid: 'vendor' },
      });
      await userRoleRepo.save(userRoleRepo.create({ user, role }));

      const permRepo: Repository<Permissions> =
        manager.getRepository(Permissions);
      const userPermRepo: Repository<UserPermissions> =
        manager.getRepository(UserPermissions);

      for (const permName of VENDOR_DEFAULT_PERMISSIONS) {
        const permission = await permRepo.findOne({
          where: { name: permName },
        });
        if (!permission) {
          this.logger.warn(
            `Permission "${permName}" not found — run npm run seed:rbac.`,
          );
          continue;
        }
        const alreadyAssigned = await userPermRepo.findOne({
          where: { user: { id: user.id }, permission: { id: permission.id } },
        });
        if (!alreadyAssigned) {
          await userPermRepo.save(
            userPermRepo.create({ user, permission }),
          );
        }
      }

      await brandsRepo.save(
        brandsRepo.create({
          uuid: user.uuid,
          name: user.name ?? `Brand-${user.uuid}`,
          thumbnail:
            'https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_960_720.png',
        }),
      );

      created = (await userRepo.findOne({
        where: { username },
        relations: ['userRoleMappings.role'],
      }))!;
    });

    return created;
  }
}
