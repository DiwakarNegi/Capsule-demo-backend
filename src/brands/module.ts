import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Brands } from './entities';
import { BrandsRepository } from './repositories';
import { AdminBrandsController, UserBrandsController } from './controllers';
import { AdminBrandsService, UserBrandsService } from './services';
import { BrandsTransformer } from './transformers';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Brands])],
  controllers: [AdminBrandsController, UserBrandsController],
  providers: [
    BrandsRepository,
    AdminBrandsService,
    UserBrandsService,
    BrandsTransformer,
  ],
  exports: [BrandsRepository],
})
export class BrandsModule {}
