import Anthropic from '@anthropic-ai/sdk';
import sharp from 'sharp';
import { recordUsage } from './quota.js';

const API_KEY = process.env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_AUTH_TOKEN ?? '';
const BASE_URL = process.env.ANTHROPIC_BASE_URL?.replace(/\/$/, '');
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-latest';

const anthropic = API_KEY
  ? new Anthropic({
      apiKey: API_KEY,
      baseURL: BASE_URL || undefined,
    })
  : null;

const PROMPT = `You are a design expert. Analyze this image and generate exactly 3-5 design terminology keywords that best describe its visual style, layout, color palette, typography, composition, or interaction patterns.

Return ONLY a valid JSON array with no other text:
[
  {"en": "Asymmetric Balance", "zh": "非对称平衡"},
  {"en": "Negative Space", "zh": "留白"}
]

Important: Always generate 3-5 terms even if the image doesn't look like a professional design screenshot. Describe what you see from a design perspective (colors, composition, mood, style).
Rules:
- Exactly 3-5 terms total
- Each term must be specific design vocabulary
- English terms: 1-3 words preferred`;

export interface DesignTerm {
  en: string;
  zh: string;
}

export async function generateTerms(imageBuffer: Buffer): Promise<DesignTerm[]> {
  if (!anthropic) {
    throw new Error('Missing ANTHROPIC_API_KEY');
  }

  const compressed = await sharp(imageBuffer)
    .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();

  const base64 = compressed.toString('base64');

  const data = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/jpeg',
            data: base64,
          },
        },
        { type: 'text', text: PROMPT },
      ],
    }],
  });

  const inputTokens = data.usage?.input_tokens ?? 0;
  const outputTokens = data.usage?.output_tokens ?? 0;
  const costCents = Math.ceil((inputTokens * 3 + outputTokens * 15) / 1_000_000 * 100);
  await recordUsage(costCents);

  const text = data.content.find(c => c.type === 'text')?.text ?? '';

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  const parsed: DesignTerm[] = JSON.parse(jsonMatch[0]);
  return parsed.filter((t: DesignTerm) => t.en && t.zh).slice(0, 5);
}
