import { CliModule } from '@app/core/cli';
import { CommandFactory } from 'nest-commander';

async function bootstrap() {
  await CommandFactory.run(CliModule, { logger: ['log', 'error', 'warn'] });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
