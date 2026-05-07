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

const PROMPT = `You are a top-tier design director. Analyze this image and pick only the most defining design tag(s) that would help a PM or designer instantly communicate this aesthetic to an AI image generator or design system.

Scan across: genre/era, color system, typography, layout, material/texture, spatial rhythm, atmosphere.

Return ONLY a valid JSON array with no other text. Fewer but sharper is better — if nothing truly stands out beyond the genre, say just 1. Push to 4 only when the image genuinely spans multiple strong dimensions:
[
  {"en": "Brutalism", "zh": "野性主义"},
  {"en": "Editorial Grid", "zh": "编辑网格"},
  {"en": "Desaturated Earth", "zh": "降饱和大地色"},
  {"en": "Motion Blur", "zh": "动态模糊"}
]

Rules:
- 1–4 terms total; default to 1–2 unless the image is richly layered
- English: actionable design keyword, 1–3 words, Title Case
- Chinese: industry-standard translation, 2–5 characters
- Every term must be something you'd actually type into a prompt — if it won't produce a visual difference, skip it
- Never output vague academic filler like "balance", "harmony", "contrast"`;

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
  return parsed.filter((t: DesignTerm) => t.en && t.zh).slice(0, 4);
}
