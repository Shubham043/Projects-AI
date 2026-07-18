import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';

@Injectable()
export class GenerationService {
    async generate(question: string, contextChunks: string[]): Promise<string> {
        const Groqclient = new Groq(process.env.GROQ_API_KEY);

    }
}
