import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Client } from 'pg';
import { EmbeddingService } from './embedding/embedding.service';

dotenv.config();

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const size = text.length;
    const numberofchunks = size / chunkSize;
    const chunks: string[] = [];

    if (size == 0) return [];
    if (numberofchunks == 0) {
        chunks.push(text);
        return chunks;
    }
    let extra = 0;
    for (let i = 0; i < numberofchunks; i++) {
        let currchunk = "";
        let firstindex = Math.max(0, i * chunkSize + extra - overlap);
        let lastindex = i * chunkSize + chunkSize;
        let lastword = text.charAt(lastindex);
        let ex = lastindex;

        while (lastword != " " && lastindex < size) {
            lastindex++;
            lastword = text.charAt(lastindex);
        }
        currchunk += text.substring(firstindex, lastindex);
        extra = lastindex - ex;

        chunks.push(currchunk);
    }
    return chunks;
}

async function main() {
    // Step 1: read the file
    const filePath = path.join(__dirname, 'data', 'rescuelink-readme.md');
    const content = fs.readFileSync(filePath, 'utf-8');
    console.log(`Loaded ${content.length} characters`);

    // Step 2: chunk it
    const chunks = chunkText(content, 500, 50);
    console.log(`Created ${chunks.length} chunks`);

    // Step 3: connect to Postgres
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    // Step 4: embed + insert each chunk
    const embeddingService = new EmbeddingService();

    for (let i = 0; i < chunks.length; i++) {
        const chunkContent = chunks[i];
        const embedding = await embeddingService.embedText(chunkContent);

        // pgvector expects the vector as a string like '[0.1,0.2,0.3,...]'
        const vectorString = `[${embedding.join(',')}]`;

        await client.query(
            `INSERT INTO document_chunks (source, chunk_index, content, embedding)
       VALUES ($1, $2, $3, $4)`,
            ['rescuelink-readme', i, chunkContent, vectorString]
        );

        console.log(`Inserted chunk ${i + 1}/${chunks.length}`);
    }

    await client.end();
    console.log('Ingestion complete.');
}

main().catch((err) => {
    console.error('Ingestion failed:', err);
    process.exit(1);
});