import Ajv from 'ajv'
import { AI_OUTPUT_SCHEMA } from '../../../src/beauty/rules/aiOutputSchema.js'

const ajv = new Ajv({ allErrors: true, strict: false })
const validateFn = ajv.compile(AI_OUTPUT_SCHEMA)

export function validateAiOutput(obj) {
  const ok = validateFn(obj)
  return { ok, errors: ok ? [] : (validateFn.errors || []).map((e) => `${e.instancePath} ${e.message}`) }
}
