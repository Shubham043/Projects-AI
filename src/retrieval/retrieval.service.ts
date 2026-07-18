import { Injectable } from '@nestjs/common';
import { Client } from 'pg';
import { EmbeddingService } from 'src/embedding/embedding.service';

@Injectable()
export class RetrievalService {
    private client: Client;

    constructor(private embeddingService: EmbeddingService) {
        this.client = new Client({ connectionString: process.env.DATABASE_URL });
        this.client.connect();
    }

    async retrieve(question: string, topK: number): Promise<string[]> {
        const questionEmbed = await this.embeddingService.embedText(question);
        const vectorString = `[${questionEmbed.join(',')}]`;

        const result = await this.client.query(
            `SELECT content FROM document_chunks ORDER BY embedding <=> $1 LIMIT $2`,
            [vectorString, topK]
        );

        return result.rows.map(row => row.content);
    }
}
