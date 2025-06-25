import { describe, it, expect, vi } from 'vitest'
import { createClient } from '../src/index.js'

declare module '../src/index.js' {
  interface SuccessWrapper<T> {
    status: 'happy',
    result: T
  }

  interface ErrorWrapper<T> {
    status: 'sad',
    result: null,
    error: { message: string }
  }
}

describe('interceptors', () => {
  it('interceptor should transform the response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ foo: 'bar' })
    })

    global.fetch = mockFetch

    type APISchema = {
      '/': {
        POST: {
          body: {
            name: string
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
      baseUrl: 'https://api.example.com',
      interceptors: {
        success: (data) => {
          return {
            status: 'happy',
            result: data
          }
        }
      }
    })

    const result = await client['/'].post({ body: { name: 'John' } })
    expect(result.status).toBe('happy')
  })

  it('interceptor should transform the error', async () => {
    type APISchema = {
      '/': {
        GET: {
          query: {
            id: number
          }
          response: {
            200: {
              foo: "bar"
            }
          }
        }
      }
    }

    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'bad request' })
    })

    global.fetch = mockFetch
    const client = createClient<APISchema>({
      baseUrl: 'https://api.example.com',
      interceptors: {
        error: (error) => {
          return {
            status: 'sad',
            error
          }
        }
      }
    })

    const result = await client['/'].get({ query: { id: 123 } })
    expect(result.status).toBe('sad')
  })

  it('interceptor should be able to throw an error', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: 'bad request' })
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

    class ApiError extends Error {
      constructor(message: string) {
        super(message)
      }
    }

    const client = createClient<APISchema>({
      baseUrl: 'https://api.example.com',
      interceptors: {
        error: (error) => {
          throw new ApiError(error)
        }
      }
    })

    await expect(client['/'].get({ query: { id: 123 } })).rejects.toThrow(ApiError)
  })
})