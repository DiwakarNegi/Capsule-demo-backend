import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';

@Controller({
  path: 'health',
  version: VERSION_NEUTRAL,
})
export class HealthController {
  private readonly startTime = Date.now();

  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Number(((Date.now() - this.startTime) / 1000).toFixed(2)),
    };
  }
}
