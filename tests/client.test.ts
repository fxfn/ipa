import { describe, it, expect, vi } from 'vitest'
import { createClient } from '../src/client.js'

describe('createClient', () => {
  it('should create a client', () => {
    const client = createClient({
      baseUrl: 'https://api.example.com'
    })

    expect(client).toBeDefined()
  })

  it('should create a client with an api schema', () => {

    type APISchema = {
      '/': {
        GET: {
          query: {
            id: number
          },
          response: {
            type: 'object',
            properties: {
              id: {
                type: 'string'
              }
            }
          }
        }
      }
    }

    const client = createClient<APISchema>({
      baseUrl: 'https://api.example.com'
    })

    expect(client['/'].get).toBeDefined()
  })

  it('should create a client with an access token', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: '123' })
    })

    // Mock the global fetch function
    global.fetch = mockFetch

    type APISchema = {
      '/': {
        GET: {
          query: {
            id: number
          }
        }
      }
    }

    const client = createClient<APISchema>({
      baseUrl: 'https://api.example.com',
      accessToken: '123'
    })

    await client['/'].get({ query: { id: 123 } })
    
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/?id=123',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'authorization': 'bearer 123'
        })
      })
    )
  })

  it('should make an api call when a method is called', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: '123' })
    })

    // Mock the global fetch function
    global.fetch = mockFetch

    type APISchema = {
      '/': {
        GET: {
          query: {
            id: number
          }
        }
      }
    }

    const client = createClient<APISchema>({
      baseUrl: 'https://api.example.com',
    })

    await client['/'].get({ query: { id: 123 } })
    
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/?id=123',
      expect.objectContaining({
        method: 'GET',
      })
    )
  })
  
  it('should replace path parameters in the url', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: '123' })
    })

    global.fetch = mockFetch

    type APISchema = {
      '/api/users/:id/posts': {
        GET: {
          params: {
            id: number
          }
        }
      }
    }

    const client = createClient<APISchema>({
      baseUrl: 'https://api.example.com'
    })

    await client['/api/users/:id/posts'].get({ 
      params: { 
        id: 123 
      } 
    })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/api/users/123/posts',
      expect.objectContaining({
        method: 'GET',
      })
    )
  })

  it('should add a content-type header when a body is provided', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: '123' })
    })

    global.fetch = mockFetch

    type APISchema = {
      '/': {
        POST: {
          body: {
            name: string
          }
        }
      }
    }

    const client = createClient<APISchema>({
      baseUrl: 'https://api.example.com'
    })

    await client['/'].post({ body: { name: 'John' } })

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/',
      expect.objectContaining({
        body: "{\"name\":\"John\"}",
        headers: {
          'Content-Type': 'application/json'
        }
      })
    )
  })

  it('should return an error when the api call fails', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'Bad Request' })
    })

    global.fetch = mockFetch

    type APISchema = {
      '/': {
        POST: {
          body: {
            name: string
          }
        }
      }
    }

    const client = createClient<APISchema, unknown, { message: string }>({
      baseUrl: 'https://api.example.com'
    })

    const result = await client['/'].post({ body: { name: 'John' } })
    expect(result.error).toBeDefined()
    expect(result.error!.message).toContain('Bad Request')
  })

  it('should allow a user to define the wrapper functions for ok and error', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: '123' })
    })

    global.fetch = mockFetch

    type APISchema = {
      '/': {
        GET: {
          query: {
            id: number
          }
        }
      }
    }

    const client = createClient<APISchema>({
      baseUrl: 'https://api.example.com',
      ok: (result: unknown) => ({
        status: 'happy',
        result
      }),
      error: (error: unknown) => ({
        status: 'sad',
        error
      })
    })

    const result = await client['/'].get({ query: { id: 123 } })
    expect(result.success).toBe(true)
    expect(result.result).toBeDefined()
    expect(result.result!.status).toBe('happy')
    expect(result.result!.result).toEqual({ id: '123' })
  })

  it('should infer types from ok and error functions', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: '123' })
    })

    global.fetch = mockFetch

    type APISchema = {
      '/': {
        GET: {
          query: {
            id: number
          }
        }
      }
    }

    const client = createClient<APISchema>({
      baseUrl: 'https://api.example.com',
      ok: (result: unknown) => ({
        status: 'happy' as const,
        data: result
      }),
      error: (error: unknown) => ({
        status: 'sad' as const,
        message: String(error)
      })
    })

    const result = await client['/'].get({ query: { id: 123 } })
    
    // TypeScript should infer the correct types
    expect(result.success).toBe(true)
    expect(result.result).toBeDefined()
    expect(result.result!.status).toBe('happy')
    expect(result.result!.data).toEqual({ id: '123' })
  })
})