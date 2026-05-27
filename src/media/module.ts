import { Module } from '@nestjs/common';
import { FilesModule } from '@app/core/files';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MediaTransformer } from './transformers';
import {
  MediaAdminController,
  MediaCapsulesController,
  MediaUserController,
} from './controllers';
import {
  AdminMediaService,
  CapsulesMediaService,
  UserMediaService,
} from './services';

@Module({
  imports: [
    FilesModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        region: config.get('files.region')!,
        bucket: config.get('files.bucket')!,
        credentials: {
          accessKeyId: config.get('files.accessKeyId')!,
          secretAccessKey: config.get('files.secretAccessKey')!,
        },
      }),
    }),
  ],
  controllers: [
    MediaAdminController,
    MediaUserController,
    MediaCapsulesController,
  ],
  providers: [
    MediaTransformer,
    AdminMediaService,
    UserMediaService,
    CapsulesMediaService,
  ],
})
export class MediaModule {}
