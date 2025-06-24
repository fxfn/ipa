import { describe, it, expect } from 'vitest'
import { transformType, transformTypes } from '../../src/lib/transform-type.js'

describe('transformType', () => {
  it('should transform a simple type', () => {
    const type = { type: 'string' }
    const result = transformType(type)
    expect(result).toEqual('string')
  })

  it('should transform a type with a nullable property', () => {
    const type = { type: 'string', nullable: true }
    const result = transformType(type)
    expect(result).toEqual({ __nullable: true, value: 'string' })
  })

  it('should transform a type with a number', () => {
    const type = { type: 'number' }
    const result = transformType(type)
    expect(result).toEqual('number')
  })

  it('should transform a type with a boolean', () => {
    const type = { type: 'boolean' }
    const result = transformType(type)
    expect(result).toEqual('boolean')
  })

  it('should handle an unknown type by returning any', () => {
    const type = { type: 'unknown' }
    const result = transformType(type)
    expect(result).toEqual('any')
  })

  describe('objects', () => {
    it('should transform a type with an object', () => {
      const type = { type: 'object', properties: { id: { type: 'string' } } }
      const result = transformType(type)
      expect(result).toEqual({ id: 'string' })
    })

    it('should transform a nullable object type', () => {
      const type = { type: 'object', properties: { id: { type: 'string', nullable: true } } }
      const result = transformType(type)
      expect(result).toEqual({ id: { __nullable: true, value: 'string' } })
    })

    it('should transform a type with additionalProperties', () => {
      const type = { type: 'object', additionalProperties: true }
      const result = transformType(type)
      expect(result).toEqual({ '[key: string]': 'any' })
    })

    it('should transform a type with additionalProperties and a specific type', () => {
      const type = { type: 'object', additionalProperties: { type: 'string' } }
      const result = transformType(type)
      expect(result).toEqual({ '[key: string]': 'string' })
    })

    it('should transform an object with no properties', () => {
      const type = { type: 'object' }
      const result = transformType(type)
      expect(result).toEqual({ '[key: string]': 'any' })
    })
  })

  describe('arrays', () => {
    it('should transform a type with an array', () => {
      const type = { type: 'array', items: { type: 'string' } }
      const result = transformType(type)
      expect(result).toEqual(['string'])
    })
  
    it('should transform a type with an array of objects', () => {
      const type = { type: 'array', items: { type: 'object', properties: { id: { type: 'string' } } } }
      const result = transformType(type)
      expect(result).toEqual([{ id: 'string' }])
    })

    it('should transform an array with no items', () => {
      const type = { type: 'array' }
      const result = transformType(type)
      expect(result).toEqual(['any'])
    })

    it('should transform an array with a nullable item', () => {
      const type = { type: 'array', items: { type: 'string', nullable: true } }
    })
  })
})

describe('transformTypes', () => {
  it('should transform a type with a nullable property', () => {
    const types = {
      id: { type: 'string', nullable: true }
    }
    const result = transformTypes(types)
    expect(result).toEqual({ id: { __nullable: true, value: 'string' } })
  })
})