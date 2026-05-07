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

const SYSTEM_PROMPT = `You are a discerning design director. You analyze collections of design inspiration images and synthesize them into personal "Design Preference Skill" documents in markdown.

Each image was selected by the same person as design inspiration. Your job is to find the PATTERNS — what aesthetic threads connect these images? What does this person consistently gravitate toward?

Base every observation on what is ACTUALLY VISIBLE in the provided images. Prioritize patterns seen across 2+ images over single-image observations. Use confident, declarative language — no hedging (might, perhaps, could, maybe, seems). Be specific enough to guide design decisions.

Output ONLY the markdown document. No preamble, no postscript. Total output: 350-650 words.`;

const USER_PROMPT = `Analyze these design inspiration images and synthesize a "Design Preference Skill" markdown document.

Each image comes with its AI-generated design tags for context. Look for recurring patterns across images.

Output a markdown document with EXACTLY these sections using ## headings:

## Design Identity
A 2-3 sentence summary of the overarching aesthetic. What genre, era, or design tradition do these images collectively evoke?

## Color System
Describe color tendencies across images: palette temperature, saturation level, contrast ratio preferences, and specific recurring hues. Note black/white usage if notable.

## Typography
Describe font personality: serif/sans-serif, weight preferences, letter-spacing style, typographic hierarchy patterns.

## Spatial Language
Describe layout tendencies: density, grid adherence, symmetry vs asymmetry, negative space usage, alignment preferences, compositional rhythm.

## Atmosphere
Describe emotional and sensory register: clean/raw, warm/cold, energetic/calm, nostalgic/futuristic, playful/serious, tactile/digital.

## Material & Surface
Describe surface qualities: matte/glossy, paper/digital, rough/smooth, transparent/opaque, flat/textured.

## Design Principles
List 3-7 actionable design rules consistently appearing across images. Format as bullet points. Each must be immediately applicable.

## Using This Skill
A 2-3 sentence paragraph explaining how to use this document as a reusable design preference profile for AI image generation, design briefs, or team alignment.`;

export async function generateDesignSkill(
  imageBuffers: Buffer[],
  termsContext: string[]
): Promise<string> {
  if (!anthropic) throw new Error('Missing ANTHROPIC_API_KEY');

  // Compress all images
  const compressedImages = await Promise.all(
    imageBuffers.map(buf =>
      sharp(buf)
        .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toBuffer()
    )
  );

  // Build content blocks: interleave labels with images
  const content: Anthropic.Messages.ContentBlockParam[] = [];

  for (let i = 0; i < compressedImages.length; i++) {
    if (i > 0) {
      content.push({ type: 'text', text: `--- Image ${i + 1} ---\nTags: ${termsContext[i] || 'No specific tags'}` });
    } else {
      content.push({ type: 'text', text: `Image 1 tags: ${termsContext[0] || 'No specific tags'}` });
    }
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: compressedImages[i].toString('base64'),
      },
    });
  }

  content.push({ type: 'text', text: USER_PROMPT });

  const data = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });

  const inputTokens = data.usage?.input_tokens ?? 0;
  const outputTokens = data.usage?.output_tokens ?? 0;
  const costCents = Math.ceil((inputTokens * 3 + outputTokens * 15) / 1_000_000 * 100);
  await recordUsage(costCents);

  return data.content.find(c => c.type === 'text')?.text ?? '';
}
