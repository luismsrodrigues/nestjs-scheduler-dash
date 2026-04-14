import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { HttpClient } from 'tsrpc';
import { serviceAProto, serviceBProto } from '@sample-ms/shared';

@Controller()
export class AppController {
  private readonly randomService = new HttpClient(serviceAProto, {
    server: `http://localhost:${process.env.RANDOM_SERVICE_PORT ?? 4001}`,
    json: true,
    logger: undefined,
  });

  private readonly schedulerService = new HttpClient(serviceBProto, {
    server: `http://localhost:${process.env.SCHEDULER_SERVICE_PORT ?? 4002}`,
    json: true,
    logger: undefined,
  });

  @Get('greet')
  async greet(@Query('name') name: string = 'World') {
    const result = await this.randomService.callApi('Greet', { name });
    if (!result.isSucc) {
      throw new HttpException(result.err.message, HttpStatus.BAD_GATEWAY);
    }
    return result.res;
  }

  @Get('scheduler/stats')
  async schedulerStats() {
    const result = await this.schedulerService.callApi('GetSchedulerStats', {});
    if (!result.isSucc) {
      throw new HttpException(result.err.message, HttpStatus.BAD_GATEWAY);
    }
    return result.res;
  }
}
