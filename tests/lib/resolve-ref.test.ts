import { describe, it, expect } from 'vitest'
import { resolveRef } from '../../src/lib/resolve-ref.js'

describe('resolveRef', () => {
  it('should resolve a ref', () => {
    const schema = { $ref: '#/components/schemas/id' }
    const schemas = { 
      id: { 
        type: 'string' 
      } 
    }
    const result = resolveRef(schema, schemas)
    expect(result).toEqual({ type: 'string' })
  })

  it('should handle circular refs', () => {
    const schema = { $ref: '#/components/schemas/id' }
    const schemas = { 
      id: { 
        $ref: '#/components/schemas/id' 
      } 
    }
    const result = resolveRef(schema, schemas)
    expect(result).toEqual({ $ref: '#/components/schemas/id' })
  })

  it('should iterate over all properties', () => {
    const schema = { $ref: '#/components/schemas/id' }
    const schemas = { 
      id: { 
        type: 'string', 
        properties: { 
          name: { 
            type: 'string' 
          } 
        } 
      } 
    }
    const result = resolveRef(schema, schemas)
    expect(result).toEqual({ type: 'string', properties: { name: { type: 'string' } } })
  })

  it('should iterate over all items', () => {
    const schema = { $ref: '#/components/schemas/id' }
    const schemas = { 
      id: { 
        type: 'string', 
        items: { 
          type: 'string' 
        } 
      } 
    }
    const result = resolveRef(schema, schemas)
    expect(result).toEqual({ type: 'string', items: { type: 'string' } })
  })

  it('should iterate over all properties and items', () => {
    const schema = { $ref: '#/components/schemas/id' }
    const schemas = { 
      id: { 
        type: 'string', 
        properties: { 
          name: { 
            type: 'string' 
          } 
        }, 
        items: { 
          type: 'string' 
        } 
      } 
    }
    const result = resolveRef(schema, schemas)
    expect(result).toEqual({ type: 'string', properties: { name: { type: 'string' } }, items: { type: 'string' } })
  })

  it('should handle a schema that is not a ref', () => {
    const schema = { type: 'string' }
    const schemas = { id: { type: 'string' } }
    // @ts-expect-error - we want to test the non-ref case
    const result = resolveRef(schema, schemas)
    expect(result).toEqual({ type: 'string' })
  })

  it('should handle a schema that has nested refs', () => {
    const schema = { $ref: '#/components/schemas/id' }
    const schemas = { 
      id: { 
        type: 'string', 
        properties: { 
          name: { 
            $ref: '#/components/schemas/name' 
          } 
        } 
      },
      name: {
        type: 'string'
      }
    }

    const result = resolveRef(schema, schemas)
    expect(result).toEqual({ type: 'string', properties: { name: { type: 'string' } } })
  })

  it('should handle a schema that has an array with a ref', () => {
    const schema = { $ref: '#/components/schemas/id' }
    const schemas = { 
      id: { 
        type: 'array', 
        items: { 
          $ref: '#/components/schemas/item'
        } 
      },
      item: {
        type: 'string'
      }
    }

    const result = resolveRef(schema, schemas)
    expect(result).toEqual({ type: 'array', items: { type: 'string' } })
  })

  it('should handle a schema that has a property that is an array which has a ref', () => {
    const schema = { $ref: '#/components/schemas/items' }
    const schemas = { 
      items: { 
        type: 'object', 
        properties: {
          items: { 
            type: 'array', 
            items: {
              $ref: '#/components/schemas/item'
            }
          }
        }
      },
      item: {
        type: 'object',
        properties: {
          name: {
            type: 'string'
          }
        }
      }
    }

    const result = resolveRef(schema, schemas)
    expect(result).toEqual({ type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } } } })
  })
})