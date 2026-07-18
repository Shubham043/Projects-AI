import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { RetrievalService } from './retrieval/retrieval.service';
import { GenerationService } from './generation/generation.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService,
    private readonly retrievalService: RetrievalService,
    private readonly generationService: GenerationService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('retrieve')
  async retrieve(@Query('q') question: string) {
    const contextChunks = await this.retrievalService.retrieve(question, 3);
    return { chunks: contextChunks };
  }

  @Post('ask')
  async ask(@Body('question') question: string) {
    const contextChunks = await this.retrievalService.retrieve(question, 3);
    console.log("Final answer", contextChunks)
    const answer = await this.generationService.generate(question, contextChunks);
    console.log("Final answer", answer)
    return { answer: answer }
  }
}
