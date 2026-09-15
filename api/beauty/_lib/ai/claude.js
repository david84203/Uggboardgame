import Anthropic from '@anthropic-ai/sdk'
import { AI_OUTPUT_SCHEMA } from '../../../../src/beauty/rules/aiOutputSchema.js'
import { SYSTEM_PROMPT, userMessage } from '../prompt.js'

const MODEL = process.env.BEAUTY_CLAUDE_MODEL || 'claude-opus-5'
let client = null

export async function analyzeWithClaude({ imageBase64, ...input }) {
  client = client || new Anthropic({ timeout: 25_000, maxRetries: 2 })
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 2000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: AI_OUTPUT_SCHEMA } },
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: userMessage(input) },
        ],
      },
    ],
  })
  if (response.stop_reason === 'refusal') {
    throw Object.assign(new Error(`refused:${response.stop_details?.category ?? 'unknown'}`), { status: 422, code: 'refusal' })
  }
  const text = response.content.find((b) => b.type === 'text')
  if (!text) throw Object.assign(new Error('no text block'), { status: 502 })
  return {
    output: JSON.parse(text.text),
    usage: {
      input: response.usage?.input_tokens ?? 0,
      output: response.usage?.output_tokens ?? 0,
      cacheRead: response.usage?.cache_read_input_tokens ?? 0,
      cacheWrite: response.usage?.cache_creation_input_tokens ?? 0,
    },
    model: response.model,
  }
}
