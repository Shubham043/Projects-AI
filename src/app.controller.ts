import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { RetrievalService } from './retrieval/retrieval.service';
import { GenerationService } from './generation/generation.service';
import { AgentService } from './agent/agent.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService,
    private readonly retrievalService: RetrievalService,
    private readonly agentService: AgentService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('retrieve')
  async retrieve(@Query('q') question: string) {
    const contextChunks = await this.retrievalService.retrieve(question, 3);
    return { chunks: contextChunks };
  }

  // @Post('ask')
  // async ask(@Body('question') question: string) {
  //   const contextChunks = await this.retrievalService.retrieve(question, 3);
  //   console.log("Final answer", contextChunks)
  //   const answer = await this.generationService.generate(question, contextChunks);
  //   console.log("Final answer", answer)
  //   return { answer: answer }
  // }
  @Post('ask')
  async ask(@Body('question') question: string) {
    try {
      const response = await this.agentService.askAgent(question);
      console.log(JSON.stringify(response, null, 2));
      return response;
    } catch (error: any) {
      console.error("Error in POST /ask:", error);
      return { 
        success: false, 
        error: error.message || 'An error occurred during agent processing.' 
      };
    }
  }
}
