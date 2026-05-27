import { Module } from '@nestjs/common';
import {
  AdminAiController,
  CapsuleAiController,
  UsersAiController,
} from './controllers';
import { AdminAiService, CapsuleAiService, UsersAiService } from './services';
import { AiTransformer } from './transformers';
import { CapsulesModule } from '@app/src/capsules';

@Module({
  imports: [CapsulesModule],
  controllers: [AdminAiController, UsersAiController, CapsuleAiController],
  providers: [AdminAiService, UsersAiService, CapsuleAiService, AiTransformer],
  exports: [CapsuleAiService, AiTransformer],
})
export class AiModule {}
