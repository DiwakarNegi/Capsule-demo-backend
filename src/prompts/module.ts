import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prompts } from './entities';
import { PromptsRepository } from './repositories';
import { PromptsTransformer } from './transformers';
import { AdminPromptsController } from './controllers';
import { AdminPromptsService } from './services';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Prompts])],
  controllers: [AdminPromptsController],
  providers: [PromptsRepository, PromptsTransformer, AdminPromptsService],
  exports: [PromptsRepository],
})
export class PromptsModule {}
