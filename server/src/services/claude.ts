import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import { recordUsage } from './quota.js';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_AUTH_TOKEN ?? '',
  baseURL: process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com',
  defaultHeaders: {
    'anthropic-version': '2023-06-01',
  },
});

const PROMPT = `You are a design expert. Analyze this design screenshot and generate exactly 3-5 concise design terminology keywords that best describe its visual style, layout principles, color theory, typography, or interaction patterns.

Return ONLY a valid JSON array with no other text, like:
[
  {"en": "Asymmetric Balance", "zh": "非对称平衡"},
  {"en": "Negative Space", "zh": "留白"}
]

Rules:
- Maximum 5 terms, minimum 3
- Each term must be specific professional design vocabulary (not generic adjectives)
- Keep English terms concise: 1-3 words preferred`;

export interface DesignTerm {
  en: string;
  zh: string;
}

export async function generateTerms(imageBuffer: Buffer, _mimeType: string): Promise<DesignTerm[]> {
  const compressed = await sharp(imageBuffer)
    .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();

  const base64 = compressed.toString('base64');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
  });

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const costCents = Math.ceil((inputTokens * 3 + outputTokens * 15) / 1_000_000 * 100);
  await recordUsage(costCents);

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  const parsed: DesignTerm[] = JSON.parse(jsonMatch[0]);
  return parsed.filter((t: DesignTerm) => t.en && t.zh).slice(0, 5);
}
