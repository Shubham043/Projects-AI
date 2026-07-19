import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmbeddingService } from './embedding/embedding.service';
import { RetrievalService } from './retrieval/retrieval.service';
import { GenerationService } from './generation/generation.service';
import { AgentService } from './agent/agent.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, EmbeddingService, RetrievalService, GenerationService, AgentService],
})
export class AppModule {}
