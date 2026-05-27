import { Global, Module } from '@nestjs/common';
import {
  AdminInventoryController,
  VendorInventoryController,
} from './controllers';
import { AdminInventoryService, VendorInventoryService } from './services';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryRepository } from './repositories';
import { Inventory } from './entities';
import { InventoryTransformer } from './transformers';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Inventory])],
  controllers: [AdminInventoryController, VendorInventoryController],
  providers: [
    AdminInventoryService,
    VendorInventoryService,
    InventoryRepository,
    InventoryTransformer,
  ],
  exports: [InventoryRepository, InventoryTransformer],
})
export class InventoryModule {}
