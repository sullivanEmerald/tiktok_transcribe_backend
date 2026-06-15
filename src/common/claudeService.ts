import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { Utterance } from './interfaces/utterance.interface';

@Injectable()
export class ClaudeService {
    private readonly client: Anthropic;

    constructor(private readonly configService: ConfigService) {
        this.client = new Anthropic({
            apiKey: this.configService.get<string>('CLAUDE_API_KEY'),
        });
    }

    async improveTranscription(utterances: Utterance[]): Promise<Utterance[]> {
        const rawLines = utterances
            .map((seg, i) => `[${i}] ${seg.text}`)
            .join('\n');

        const response = await this.client.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 4096,
            system: `You are a professional transcript editor. Improve the clarity and fluency of raw AI-generated speech transcript segments.

                    Rules:
                    - Complete cut-off or misheard words
                    - Restore broken idioms to their correct natural form
                    - Fix grammar and tense errors caused by speech recognition
                    - Do NOT change meaning, tone, perspective, or add new information
                    - Do NOT summarize, merge, split, or reorder lines
                    - Preserve intentional phrases like "Hallelujah", "Are you there?" as they are
                    - Return ONLY a valid JSON array of corrected strings, one per input line, in the same order
                    - The array length must exactly match the number of input lines
                    - Do not include any explanation, markdown, or extra text — only the raw JSON array`,
            messages: [{
                role: 'user',
                content: `Improve these transcript lines. Return only a JSON array:\n\n${rawLines}`
            }]
        });

        console.log('Claude response:', response);

        // const improved: string[] = JSON.parse(response);

        return utterances.map((seg, i) => ({
            ...seg,
            text: seg.text,
        }));
    }

}