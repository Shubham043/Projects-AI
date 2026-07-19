import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';
import { RetrievalService } from 'src/retrieval/retrieval.service';

@Injectable()
export class GenerationService {

    async generate(question: string, contextChunks: string[]): Promise<string> {
        const Groqclient = new Groq({
            apiKey: process.env.GROQ_API_KEY || '',
        });
        const text = contextChunks.join("\n");
        const chatCompletion = await Groqclient.chat.completions.create({
            model: 'llama-3.1-8b-instant',
            messages: [
                { role: 'system', content: `Answer based on this context: ${text}` },
                { role: 'user', content: question }
            ]
        });
        return chatCompletion.choices[0].message.content || '';
    }
}
