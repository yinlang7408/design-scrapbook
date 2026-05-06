import sharp from 'sharp';
import { recordUsage } from './quota.js';

const API_KEY = process.env.ANTHROPIC_AUTH_TOKEN ?? '';
const BASE_URL = (process.env.ANTHROPIC_BASE_URL ?? 'https://api.anthropic.com').replace(/\/$/, '');

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

export async function generateTerms(imageBuffer: Buffer, mimeType: string): Promise<DesignTerm[]> {
  const compressed = await sharp(imageBuffer)
    .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer();

  const base64 = compressed.toString('base64');

  const body = {
    model: 'deepseek-v4-pro',
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
        { type: 'text', text: PROMPT },
      ],
    }],
  };

  const res = await fetch(`${BASE_URL}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Claude API error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json() as {
    usage?: { input_tokens: number; output_tokens: number };
    content: Array<{ type: string; text?: string }>;
  };

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
