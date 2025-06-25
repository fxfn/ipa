import { describe, it, expect, vi } from 'vitest'
import { createClient } from '../src/index.js'

declare module '../src/index.js' {
  interface SuccessWrapper<T> {
    success: true,
    result: T
  }

  interface ErrorWrapper<T> {
    success: false,
    result: null,
    error: { message: string }
  }
}

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
            200: {
              foo: "bar"
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

  it('should create a client with headers', async () => {
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
      headers: {
        authorization: 'bearer 123'
      }
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

  it('should pass headers to the request', async () => {
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

    await client['/'].get({ 
      query: { 
        id: 123 
      },
      headers: {
        authorization: 'bearer 123'
      }
    })
    
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

  it('should combine the headers with the request headers', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: '123' })
    })
    
    type APISchema = {
      '/': {
        GET: {
          query: {
            id: number
          }
        }
      }
    }

    global.fetch = mockFetch
    const client = createClient<APISchema>({
      baseUrl: 'https://api.example.com',
      headers: {
        authorization: 'bearer 123'
      }
    })

    await client['/'].get({ 
      query: { 
        id: 123 
      },
      headers: {
        'x-api-key': '43214321'
      }
    })
    
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/?id=123',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'x-api-key': '43214321',
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
})