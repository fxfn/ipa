declare module '@fxfn/ipa' {
  interface SuccessWrapper<T> {
    result: T
  }
  interface ErrorWrapper<T> {
    error: T
  }
  interface ApiError {
  }

  interface DefaultConfig<T> {
    baseUrl?: string
    headers?: Record<string, string>;
    interceptors?: {
      success?: <Res extends unknown>(data: Res) => SuccessWrapper<Res>
      error?: <Err extends unknown>(error: Err) => ErrorWrapper<Err>
    }
  }
}
  
type FilterNever<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K]
};

type NonEmptyObject<T> = T extends Record<string, never> ? never : FilterNever<T>;

type MakePropertiesOptional<T> = {
  [K in keyof T as null extends T[K] ? K : undefined extends T[K] ? K : never]?: T[K];
} & {
  [K in keyof T as null extends T[K] ? never : undefined extends T[K] ? never : K]: T[K];
};

export type RequestConfig<T> = T extends { params: any } | { body: any } | { query: any }
  ? NonEmptyObject<{
    params: T extends { params: infer P } ? MakePropertiesOptional<P> : never;
    body: T extends { body: infer B } ? MakePropertiesOptional<B> : never;
    query: T extends { query: infer Q } ? MakePropertiesOptional<Q> : never;
    headers?: Record<string, string>;
  }>
  : undefined;

export type UnionResponse<T> = T extends { response: infer R } 
  ? R extends Record<number, any> 
    ? R[keyof R] 
    : never 
  : never;

export type EndpointMethods<Path extends keyof Schema, Schema, OkType = unknown, ErrorType = unknown> = {
  [Method in keyof Schema[Path] & string as Lowercase<Method>]: (
    options?: RequestConfig<Schema[Path][Method]>
  ) => Promise<
    SuccessWrapper<UnionResponse<Schema[Path][Method]>> | ErrorWrapper<UnionResponse<Schema[Path][Method]>>
  >;
};

export type APIClientPaths<Schema, OkType = unknown, ErrorType = unknown> = {
  [Path in keyof Schema]: EndpointMethods<Path, Schema, OkType, ErrorType>;
};

export type ApiResult<T> = SuccessWrapper<T> | ErrorWrapper<T>;
export type ApiInput<T> = T extends (...args: [infer I]) => any ? I : never;
export type ApiOutput<T> = T extends (...args: any[]) => Promise<infer R> ? R : never;

type HTTPMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

class BaseClient<Schema> {
  constructor(
    private config: DefaultConfig<Schema>
  ) {}

  async request(
    method: HTTPMethod,
    path: string,
    options?: {
      params?: Record<string, unknown>;
      body?: unknown;
      query?: Record<string, unknown>;
      headers?: Record<string, string>;
    }
  ) {
    const filledPath = options?.params
      ? path.replace(/:([A-Za-z]+)/g, (_, param) => String(options.params![param]))
      : path;

    const url = typeof window !== 'undefined' 
      ? new URL([this.config.baseUrl || window.location.origin, filledPath].join('')) 
      : new URL([this.config.baseUrl, filledPath].join(''));
    
    if (options?.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = Object.assign({}, this.config?.headers || {}, options?.headers || {})
    if (options?.body !== undefined) {
      if (headers['Content-Type'] === undefined) {
        headers['Content-Type'] = 'application/json';
      }
    }

    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        if (this.config.interceptors?.error) {
          return this.config.interceptors.error(await response.json())
        }

        return await response.json()
      }

      const data = response.status === 204 ? undefined : await response.json();
      if (this.config.interceptors?.success) {
        return this.config.interceptors.success(data)
      }

      return data
    }
    catch (error) {
      throw error
    }
  }
}

class MethodProxyHandler<Schema> implements ProxyHandler<object> {
  constructor(
    private client: BaseClient<Schema>,
    private path: string
  ) {}

  get(target: object, method: string) {
    if (typeof method === 'string' && ['get', 'post', 'patch', 'put', 'delete'].includes(method.toLowerCase())) {
      return (options?: { 
        params?: Record<string, unknown>,
        body: unknown,
        query: Record<string, unknown>,
        headers?: Record<string, string>
      }) => this.client.request(method.toUpperCase() as HTTPMethod, this.path, options)
    }

    return Reflect.get(target, method)
  }
}

class PathProxyHandler<Schema> implements ProxyHandler<BaseClient<Schema>> {
  get(target: BaseClient<Schema>, path: string) {
    if (typeof path === 'string') {
      return new Proxy({}, new MethodProxyHandler(target, path))
    }
    return Reflect.get(target, path)
  }
}

export function createClient<
  Schema extends unknown,
  Config extends DefaultConfig<Schema> = DefaultConfig<Schema>,
>(config?: Config) {
  const client = new BaseClient(config ?? {})
  return new Proxy(client, new PathProxyHandler<Schema>()) as unknown as APIClientPaths<Schema>
}

export function createTypedClient<T>(config?: DefaultConfig<T>): APIClientPaths<T> {
  return createClient<T>(config);
}