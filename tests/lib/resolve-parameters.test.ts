import { describe, it, expect } from 'vitest'
import { resolveParameters } from '../../src/lib/resolve-parameters.js'

describe('resolveParameters', () => {
  it('should resolve parameters', () => {
    const parameters = [{ name: 'id', in: 'query' as const, schema: { type: 'string' } }]
    const schemas = { id: { type: 'string' } }
    const result = resolveParameters('query', parameters, schemas)
    expect(result).toEqual({ id: { type: 'string' } })
  })

  it('should return null if no parameters are found', () => {
    const parameters = []
    const schemas = {}
    // @ts-expect-error - we want to test the null case
    const result = resolveParameters('query', null, schemas)
    expect(result).toBeNull()
  })

  it('should return null if no parameters of the specified type are found', () => {
    const parameters = [{ name: 'id', in: 'path' as const, schema: { type: 'string' } }]
    const schemas = {}
    const result = resolveParameters('query', parameters, schemas)
    expect(result).toBeNull()
  })

  it('should handle schema being null', () => {
    const parameters = [{ name: 'id', in: 'query' as const, schema: null }]
    const schemas = { id: { type: 'string' } }
    const result = resolveParameters('query', parameters, schemas)
    expect(result).toBeNull()
  })
})