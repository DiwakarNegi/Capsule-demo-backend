import { CoreModule } from '@app/core';
import { DbModule } from '@app/core/db';
import { Module } from '@nestjs/common';
import { UsersModule } from './users';
import { AuthModule } from './auth';
import { RBACModule } from './rbac';
import { MediaModule } from './media';
import { InventoryModule } from './inventory';
import { TaxonomyModule } from './taxonaomy';
import { BrandsModule } from './brands';
import { AiModule } from './ai';
import { PromptsModule } from './prompts';
import { CapsulesModule } from './capsules';
import { HealthModule } from './health';
import { SeedModule } from './seed/seed-module';

@Module({
  imports: [
    CoreModule,
    DbModule,
    HealthModule,
    MediaModule,
    RBACModule,
    UsersModule,
    AuthModule,
    TaxonomyModule,
    BrandsModule,
    InventoryModule,
    PromptsModule,
    AiModule,
    CapsulesModule,
    SeedModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}