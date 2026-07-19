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

    private reciprocalRankFusion(
        vectorResults: { id: string; content: string }[],
        keywordResults: { id: string; content: string }[],
        k: number = 60
    ): { id: string; content: string; rrfScore: number }[] {
        const scoreMap = new Map<string, { content: string; rrfScore: number }>();

        // 1. Process vector results (compute 1 / (k + rank))
        vectorResults.forEach((item, index) => {
            const rank = index + 1;
            const score = 1 / (k + rank);
            const existing = scoreMap.get(item.id);
            if (existing) {
                existing.rrfScore += score;
            } else {
                scoreMap.set(item.id, { content: item.content, rrfScore: score });
            }
        });

        // 2. Process keyword results
        keywordResults.forEach((item, index) => {
            const rank = index + 1;
            const score = 1 / (k + rank);
            const existing = scoreMap.get(item.id);
            if (existing) {
                existing.rrfScore += score;
            } else {
                scoreMap.set(item.id, { content: item.content, rrfScore: score });
            }
        });

        // 3. Sort all chunks by final combined score descending
        return Array.from(scoreMap.entries()).map(([id, val]) => ({
            id,
            content: val.content,
            rrfScore: val.rrfScore
        })).sort((a, b) => b.rrfScore - a.rrfScore);
    }

    async retrieve(question: string, topK: number): Promise<string[]> {
        const questionEmbed = await this.embeddingService.embedText(question);
        const vectorString = `[${questionEmbed.join(',')}]`;

        // 1. Semantic Vector search (HNSW cosine distance)
        const vectorResult = await this.client.query(
            `SELECT id, content FROM document_chunks ORDER BY embedding <=> $1 LIMIT $2`,
            [vectorString, topK]
        );

        // 2. Keyword search (PostgreSQL full-text search)
        const keywordResult = await this.client.query(
            `SELECT id, content, ts_rank(to_tsvector('english', content), plainto_tsquery('english', $1)) AS score
             FROM document_chunks
             WHERE to_tsvector('english', content) @@ plainto_tsquery('english', $1)
             ORDER BY score DESC
             LIMIT $2`,
            [question, topK]
        );

        // 3. Reciprocal Rank Fusion to combine the rankings
        const fusedResults = this.reciprocalRankFusion(vectorResult.rows, keywordResult.rows);

        // 4. Return topK contents
        return fusedResults.slice(0, topK).map(row => row.content);
    }
}
