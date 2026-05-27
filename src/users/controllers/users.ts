import { Validate } from '@app/core/decorators';
import { Controller, Delete, Get, Patch, Req } from '@nestjs/common';
import { UserService } from '../services/users';
import { Allow } from '@app/core/decorators';
import { DeleteUserDto, UpdateUserDto } from '../dtos';
import type { FastifyRequest } from 'fastify';
import { UserTransformer } from '../transformers';

@Controller({
  path: 'users',
  version: '1',
})
export class UserController {
  constructor(
    private readonly service: UserService,
    private transformer: UserTransformer,
  ) {}

  @Allow(['vendor'])
  @Get('profile')
  async getProfile(@Req() req: FastifyRequest) {
    const response = await this.service.getProfile(req.user);
    return this.transformer.transform(response);
  }

  @Allow(['vendor'])
  @Patch('profile')
  async updateProfile(
    @Req() req: FastifyRequest,
    @Validate(UpdateUserDto) inputs: UpdateUserDto,
  ) {
    await this.service.updateProfile(req.user, inputs);
    return this.transformer.transform({ message: 'Success' });
  }

  @Allow(['vendor'])
  @Delete('profile')
  async deleteProfile(
    @Req() req: FastifyRequest,
    @Validate(DeleteUserDto) inputs: DeleteUserDto,
  ) {
    await this.service.deleteProfile(req.user, inputs);
    return this.transformer.transform({ message: 'Profile Deleted' });
  }
}
