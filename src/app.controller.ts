import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { RetrievalService } from './retrieval/retrieval.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService,
    private readonly retrievalService: RetrievalService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('retrieve')
  async retrieve(@Query('q') question: string) {
    const contextChunks = await this.retrievalService.retrieve(question, 3);
    return { chunks: contextChunks };
  }
}
