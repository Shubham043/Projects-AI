import { Injectable } from '@nestjs/common';
import Groq from 'groq-sdk';
import { RetrievalService } from 'src/retrieval/retrieval.service';

@Injectable()
export class AgentService {
    private groq: Groq;
    constructor(
        private retrievalService: RetrievalService
    ) {
        this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
    }
    private tools = [{
        type: "function" as const,
        function: {
            name: "search_documents",
            description: "Search the RescueLink project documentation for relevant information",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "search query" }
                },
                required: ["query"]
            }
        }
    }];


    async askAgent(question: string, maxIterations: number = 5) {
        let messages: any[] = [
            {
                role: "system",
                content: "You are a helpful assistant answering questions about the RescueLink project using the search_documents tool. Only answer using information found in the retrieved documents. If the retrieved documents do not contain the answer, explicitly say 'I couldn't find this information in the available documentation' — do NOT guess, speculate, or make educated guesses about technical details you cannot confirm from the retrieved context."
            },
            { role: "user", content: question }];

        try {
            for (let i = 0; i < maxIterations; i++) {
                const response = await this.groq.chat.completions.create({
                    model: 'llama-3.1-8b-instant',
                    max_tokens: 1000,
                    tools: this.tools,
                    messages
                });

                messages.push(response.choices[0].message);
                const activetools = response.choices[0].message.tool_calls;

                if (i === maxIterations - 1 && activetools) {
                    return "Could not find answer within the maximum iteration limit.";
                }

                if (activetools) {
                    const tool = activetools[0];
                    const toolFunction = tool.function;

                    if (toolFunction.name === "search_documents") {
                        try {
                            const args = JSON.parse(toolFunction.arguments);
                            const query = args.query;
                            console.log("Executing search_documents tool with query:", query);

                            const context = await this.retrievalService.retrieve(query, 5);
                            console.log("Context retrieved:", context);

                            messages.push({
                                role: "tool",
                                tool_call_id: tool.id,
                                content: context.join("\n")
                            });
                        } catch (toolError: any) {
                            console.error("Error inside search_documents tool call:", toolError);
                            messages.push({
                                role: "tool",
                                tool_call_id: tool.id,
                                content: `Error executing search: ${toolError.message || toolError}`
                            });
                        }
                    }
                } else {
                    return response.choices[0].message.content;
                }
            }
        } catch (error: any) {
            console.error("Error in askAgent loop:", error);
            throw error;
        }
    }
}
