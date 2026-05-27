import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Capsule } from './entities';
import { CapsuleRepository } from './repositories';
import { CapsuleController } from './controllers';
import { CapsuleService } from './services';
import { CapsuleTransformer } from './transformers';

@Module({
  imports: [TypeOrmModule.forFeature([Capsule])],
  controllers: [CapsuleController],
  providers: [CapsuleRepository, CapsuleService, CapsuleTransformer],
  exports: [CapsuleRepository, CapsuleTransformer],
})
export class CapsulesModule {}
