import { describe, it, expect } from 'vitest'
import { transformEndpoints } from '../../src/lib/transform-endpoints.js'

describe('transformEndpoints', () => {
  it('should transform an endpoint', () => {
    const endpoints = []
    const result = transformEndpoints(endpoints)
    expect(result).toEqual("{}")
  })

  it('should transform an endpoint with a query parameter', () => {
    const endpoints = [{
      url: '/',
      method: 'get',
      query: {
        id: { type: 'string' }
      }
    }]

    const result = transformEndpoints(endpoints)
    expect(typeof result).toBe('string')
  })

  it('should transform an endpoint with a response of an array', () => {
    const endpoints = [{
      url: '/',
      method: 'get',
      response: {
        type: 'array',
        items: {
          type: 'string'
        }
      }
    }]

    const result = transformEndpoints(endpoints)
    expect(typeof result).toBe('string')
  })

  it('should transform multiple endpoints with the same URL but different methods', () => {
    const endpoints = [{
      url: '/',
      method: 'get',
      response: {
        type: 'array',
      }
    }, {
      url: '/',
      method: 'post',
      response: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      }
    }]

    const result = transformEndpoints(endpoints)
    expect(typeof result).toBe('string')
  })

  it('should transform an endpoint with nullable properties', () => {
    const endpoints = [{
      url: '/',
      method: 'get',
      response: {
        type: 'object',
        properties: {
          id: { type: 'string', nullable: true }
        },
        __nullable: true
      }
    }]

    const result = transformEndpoints(endpoints)
    expect(typeof result).toBe('string')
  })

  it('should transform an endpoint with additionalProperties', () => {
    const endpoints = [{
      url: '/',
      method: 'get',
      response: {
        type: 'object',
        additionalProperties: true
      }
    }]

    const result = transformEndpoints(endpoints)
    expect(typeof result).toBe('string')
  })
})