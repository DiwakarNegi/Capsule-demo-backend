import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { DeleteUserDto, UpdateUserDto } from '../dtos';
import { JwtUser } from '@app/core/guards/types';
import { UsersRepository } from '../repositories';
import { Users } from '../entities';
import { pick } from 'remeda';
import { ConfigType, getConfigToken } from '@nestjs/config';
import appConfig from '@config/app';

@Injectable()
export class UserService {
  constructor(
    private readonly users: UsersRepository,
    @Inject(getConfigToken('app'))
    private readonly app: ConfigType<typeof appConfig>,
  ) { }

  async getProfile(user: JwtUser): Promise<Users> {
    return this.users.findOneOrFail({ where: { uuid: user.sub } });
  }

  async updateProfile(user: JwtUser, payload: UpdateUserDto): Promise<void> {
    await this.users.update(
      { uuid: user.sub },
      pick(payload, ['name', 'email', 'profilePicture']),
    );
  }

  async deleteProfile(user: JwtUser, payload: DeleteUserDto): Promise<void> {
    if (payload.confirmationPrompt !== this.app.userDeleteionPrompt) {
      throw new BadRequestException('Invalid confirmation prompt');
    }
    await this.users.delete({ uuid: user.sub });
  }
}
