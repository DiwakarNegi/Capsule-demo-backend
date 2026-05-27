import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Categories } from './entities';
import { CategoriesRepository } from './repositories';
import {
  AdminTaxonomiesController,
  UserTaxonomyController,
} from './controllers';
import { AdminTaxonomiesService, UserTaxonomyService } from './services';
import { TaxonomyTransformer } from './transformers';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Categories])],
  controllers: [AdminTaxonomiesController, UserTaxonomyController],
  providers: [
    CategoriesRepository,
    AdminTaxonomiesService,
    UserTaxonomyService,
    TaxonomyTransformer,
  ],
  exports: [CategoriesRepository],
})
export class TaxonomyModule {}
