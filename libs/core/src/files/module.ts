import { DynamicModule, Module, Provider } from '@nestjs/common';
import { FilesService } from './services';
import { S3Config, FilesModuleAsyncOptions } from './interfaces';
import { FILES_MODULE_OPTIONS } from './constants';

@Module({})
export class FilesModule {
  static register(options: S3Config): DynamicModule {
    return {
      global: true,
      module: FilesModule,
      providers: [
        {
          provide: FILES_MODULE_OPTIONS,
          useValue: options,
        },
        FilesService,
      ],
      exports: [FilesService],
    };
  }

  static registerAsync(options: FilesModuleAsyncOptions): DynamicModule {
    const asyncProvider: Provider = {
      provide: FILES_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    return {
      global: true,
      module: FilesModule,
      imports: options.imports || [],
      providers: [asyncProvider, FilesService],
      exports: [FilesService],
    };
  }
}
