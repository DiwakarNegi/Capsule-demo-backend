import { Validate } from '@app/core/decorators';
import { Controller, Delete, Get, Patch, Post, Req } from '@nestjs/common';
import { Allow } from '@app/core/decorators';
import {
  AdminCreateUserDto,
  AdminDeleteUserDto,
  AdminGetUserByIdDto,
  AdminGetUsersDto,
  AdminUpdateProfileDto,
  AdminUpdateUserDto,
} from '../dtos';
import type { FastifyRequest } from 'fastify';
import { AdminTransformer, UserTransformer } from '../transformers';
import { AdminUserService } from '../services';

@Controller({
  path: 'admins/users',
  version: '1',
})
export class AdminUserController {
  constructor(
    private readonly service: AdminUserService,
    private readonly userTransformer: UserTransformer,
    private readonly adminTransformer: AdminTransformer,
  ) {}

  @Allow(['super', 'admin'])
  @Get('profile')
  async getProfile(@Req() req: FastifyRequest) {
    const response = await this.service.getProfile(req.user);
    return this.adminTransformer.transform(response);
  }

  @Allow(['super', 'admin'])
  @Patch('profile')
  async updateProfile(
    @Req() req: FastifyRequest,
    @Validate(AdminUpdateProfileDto) inputs: AdminUpdateProfileDto,
  ) {
    await this.service.updateProfile(req.user, inputs);
    return this.adminTransformer.transform({ message: 'Success' });
  }

  @Allow(['super', 'admin'])
  @Get()
  async getUser(@Validate(AdminGetUsersDto) inputs: AdminGetUsersDto) {
    const response = await this.service.getUsers(inputs);
    return this.userTransformer.paginate(response);
  }

  // vendors must be declared before :id so the static segment is matched first
  @Allow(['super', 'admin'])
  @Get('vendors')
  async getVendors(@Validate(AdminGetUsersDto) inputs: AdminGetUsersDto) {
    const response = await this.service.getVendors(inputs);
    return this.userTransformer.paginate(response);
  }

  @Allow(['super', 'admin'])
  @Get(':id')
  async getUserById(
    @Validate(AdminGetUserByIdDto) inputs: AdminGetUserByIdDto,
  ) {
    const response = await this.service.getUserById(inputs);
    return this.userTransformer.transform(response);
  }

  @Allow(['super', 'admin'])
  @Post()
  async createUser(@Validate(AdminCreateUserDto) payload: AdminCreateUserDto) {
    await this.service.createUser(payload);
    return this.userTransformer.transform({ message: 'Success' });
  }

  @Allow(['super', 'admin'])
  @Patch(':id')
  async updateUser(
    @Req() req: FastifyRequest,
    @Validate(AdminUpdateUserDto) inputs: AdminUpdateUserDto,
  ) {
    await this.service.updateUser(inputs);
    return this.userTransformer.transform({ message: 'Success' });
  }

  @Allow(['super'])
  @Delete(':id')
  async deleteProfile(
    @Req() req: FastifyRequest,
    @Validate(AdminDeleteUserDto) inputs: AdminDeleteUserDto,
  ) {
    await this.service.deleteUser(inputs);
    return this.userTransformer.transform({ message: 'Profile Deleted' });
  }
}
