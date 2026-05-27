import { Validate } from '@app/core/decorators';
import { Controller, Get } from '@nestjs/common';
import { Allow } from '@app/core/decorators';
import { AdminRoleService } from '../services';
import { AdminGetRoleByIdDto, AdminGetRolesDto } from '../dtos';
import { RoleTransformer } from '../transformers';

@Controller({
  path: 'admins/roles',
  version: '1',
})
export class AdminRoleController {
  constructor(
    private readonly service: AdminRoleService,
    private transformer: RoleTransformer,
  ) {}

  @Allow(['super', 'admin'])
  @Get()
  async getRoles(@Validate(AdminGetRolesDto) inputs: AdminGetRolesDto) {
    const response = await this.service.getRoles(inputs);
    return this.transformer.paginate(response);
  }

  @Allow(['super', 'admin'])
  @Get(':id')
  async getUserById(
    @Validate(AdminGetRoleByIdDto) inputs: AdminGetRoleByIdDto,
  ) {
    const response = await this.service.getRoleById(inputs);
    return this.transformer.transform(response);
  }
}
