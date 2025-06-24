# @fxfn/ipa

Its an API but backwards.

---

Generate a typescript API Client from a swagger.json file.

## getting started (dev)

### generate a API Schema (MyService)

```bash
$ git clone https://github.com/fxfn/ipa
$ cd ipa
$ pnpm i
$ pnpm run generate http://localhost:3000/api/swagger.json MyService
```

### import @fxfn/ipa and create a client for MyService

```typescript
import { createClient } from "@fxfn/ipa"
import { MyService } from "./schema/my-service"

const client = createClient<MyService>({
  // see options
})

async function main() {
  const res = await client['/api/contacts'].get()
  console.log(res)
}

main()
```

## API Reference

### createClient Options

The `createClient` function accepts the following configuration options:

```typescript
interface ClientConfig {
  baseUrl: string
  headers?: Record<string, string>
  interceptors?: {
    success: (data: any) => any
    error: (error: any) => any
  }
}
```

- **baseUrl** (required): The base URL for all API requests
- **headers** (optional): Default headers to include in all requests
- **interceptors** (optional): Functions to transform successful responses and errors

### Declaration Merging & Interceptors

To customize the response types, you can use TypeScript declaration merging to extend the default wrapper types:

```typescript
import { createClient } from '@fxfn/ipa'

// Extend the default wrapper types
declare module '@fxfn/ipa' {
  interface SuccessWrapper<T> {
    success: true
    result: T
  }

  interface ErrorWrapper<T> {
    success: false
    result: null
    error: { 
      message: string 
    }
  }
}

// Your API schema type
type APISchema = {
  '/api/users': {
    GET: {
      response: {
        200: {
          users: Array<{ id: string; name: string }>
        }
      }
    }
  }
}

const client = createClient<APISchema>({
  baseUrl: 'https://api.example.com',

  // add interceptors to mutate the response to the shape 
  // defined in the above merged wrapper declarations
  interceptors: {
    success: (data) => ({
      success: true,
      result: data,
    }),
    error: (error) => ({
      success: false,
      result: null,
      error: {
        message: error.message,
      }
    })
  }
})
```

#### Example Responses

With the above configuration, here's what the response objects look like:

**Success Response:**
```typescript
const result = await client['/api/users'].get()
// result will be:
{
  success: true,
  result: {
    users: [
      { id: "1", name: "John Doe" },
      { id: "2", name: "Jane Smith" }
    ]
  }
}
```

**Error Response:**
```typescript
const result = await client['/api/users'].get()
// result will be:
{
  success: false,
  result: null,
  error: {
    message: "Bad Request"
  }
}
```

### Header Merging

The client supports flexible header management with automatic merging:

#### Global Headers
Set default headers that apply to all requests:

```typescript
const client = createClient<APISchema>({
  baseUrl: 'https://api.example.com',
  headers: {
    'authorization': 'bearer token123',
    'x-api-version': 'v1'
  }
})
```

#### Request-Specific Headers
Add headers for individual requests:

```typescript
await client['/api/users'].get({
  headers: {
    'x-request-id': 'unique-id',
    'cache-control': 'no-cache'
  }
})
```

#### Header Merging Behavior
Request-specific headers are merged with global headers, with request headers taking precedence:

```typescript
const client = createClient<APISchema>({
  baseUrl: 'https://api.example.com',
  headers: {
    'authorization': 'bearer token123'
  }
})

// This request will include both headers
await client['/api/users'].get({
  headers: {
    'x-api-key': 'api-key-456'
  }
})
// Final headers: { authorization: 'bearer token123', x-api-key: 'api-key-456' }
```

### Request Methods

The client supports all HTTP methods with type-safe parameters:

#### GET Requests
```typescript
// With query parameters
await client['/api/users'].get({
  query: { page: 1, limit: 10 }
})

// With path parameters
await client['/api/users/:id'].get({
  params: { id: '123' }
})
```

#### POST Requests
```typescript
// With request body
await client['/api/users'].post({
  body: { name: 'John Doe', email: 'john@example.com' }
})
```

### Path Parameters

Replace path parameters in URLs using the `params` option:

```typescript
type APISchema = {
  '/api/users/:id/posts': {
    GET: {
      params: {
        id: number
      }
    }
  }
}

// This will make a request to /api/users/123/posts
await client['/api/users/:id/posts'].get({
  params: { id: 123 }
})
```

### Query Parameters

Add query parameters to GET requests:

```typescript
await client['/api/users'].get({
  query: {
    page: 1,
    limit: 10,
    search: 'john'
  }
})
// Results in: /api/users?page=1&limit=10&search=john
```

### Request Bodies

For POST, PUT, PATCH requests, include a request body:

```typescript
await client['/api/users'].post({
  body: {
    name: 'Jane Doe',
    email: 'jane@example.com'
  }
})
```

The client automatically:
- Sets `Content-Type: application/json` header
- Serializes the body to JSON

### Response Handling

#### Success Responses
```typescript
const result = await client['/api/users'].get()
if (result.success) {
  console.log(result.result) // Typed response data
}
```

#### Error Responses
```typescript
const result = await client['/api/users'].get()
if (!result.success) {
  console.error(result.error.message) // Error message
}
```

### Type Safety

The client provides full TypeScript support with your API schema:

```typescript
type APISchema = {
  '/api/users': {
    GET: {
      query: {
        page: number
        limit: number
      }
      response: {
        200: {
          users: Array<{ id: string; name: string }>
          total: number
        }
      }
    }
    POST: {
      body: {
        name: string
        email: string
      }
      response: {
        200: {
          id: string
          name: string
          email: string
        }
      }
    }
  }
}

const client = createClient<APISchema>({
  baseUrl: 'https://api.example.com'
})

// Fully typed - TypeScript will enforce correct parameters and response types
const users = await client['/api/users'].get({ query: { page: 1, limit: 10 } })
const newUser = await client['/api/users'].post({ 
  body: { name: 'John', email: 'john@example.com' } 
})
```