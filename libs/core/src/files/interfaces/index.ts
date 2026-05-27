export interface S3Config {
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  bucket: string;
}

export interface FilesModuleAsyncOptions {
  useFactory: (...args: any[]) => Promise<S3Config> | S3Config;
  inject?: any[];
  imports?: any[];
}
