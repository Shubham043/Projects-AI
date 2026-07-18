import { Injectable } from '@nestjs/common';

@Injectable()
export class EmbeddingService {
    private model: any = null;

    private async getModel() {
        if (!this.model) {
            const { pipeline } = await (Function('return import("@xenova/transformers")')() as Promise<any>);
            this.model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }
        return this.model;
    }

    async embedText(text: string): Promise<number[]> {
        const model = await this.getModel();
        const output = await model(text, { pooling: 'mean', normalize: true });
        return Array.from(output.data);
    }
}