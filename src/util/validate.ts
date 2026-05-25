import { BadRequestError } from './errors/RequestErrors'

export function parseNumericId(val: unknown, field = 'id'): number {
  const n = Number(val)
  if (!val || isNaN(n)) throw new BadRequestError(`Missing or invalid parameter: ${field}`)
  return n
}

export function requireString(val: unknown, field: string): string {
  if (!val || typeof val !== 'string') throw new BadRequestError(`Missing required field: ${field}`)
  return val
}
