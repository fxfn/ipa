type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type FilterNever<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K]
};

type NonEmptyObject<T> = T extends Record<string, never> ? never : FilterNever<T>;

type OptionalIfEmpty<T> = T extends never ? undefined : T;

type MakePropertiesOptional<T> = {
  [K in keyof T as null extends T[K] ? K : undefined extends T[K] ? K : never]?: T[K];
} & {
  [K in keyof T as null extends T[K] ? never : undefined extends T[K] ? never : K]: T[K];
};

type RequestConfig<T> = T extends { params: any } | { body: any } | { query: any }
  ? NonEmptyObject<{
      params: T extends { params: infer P } ? MakePropertiesOptional<P> : never;
      body: T extends { body: infer B } ? MakePropertiesOptional<B> : never;
      query: T extends { query: infer Q } ? MakePropertiesOptional<Q> : never;
    }>
  : undefined;

type UnionResponse<T> = T extends { response: infer R } 
  ? R extends Record<number, any> 
    ? R[keyof R] 
    : never 
  : never;

// Define the wrapped result types
type WrappedSuccess<T> = {
  success: true;
  error: null;
  result: T;
};

type WrappedError<T> = {
  success: false;
  result: null;
  error: T;
};

type WrappedResult<T, E = unknown> = WrappedSuccess<T> | WrappedError<E>;

export type EndpointMethods<Path extends keyof Schema, Schema, OkType = unknown, ErrorType = unknown> = {
  [Method in keyof Schema[Path] & string as Lowercase<Method>]: (
    options?: RequestConfig<Schema[Path][Method]>
  ) => Promise<WrappedResult<OkType, ErrorType>>;
};

export type APIClientPaths<Schema, OkType = unknown, ErrorType = unknown> = {
  [Path in keyof Schema]: EndpointMethods<Path, Schema, OkType, ErrorType>;
};

// Extract the success result type from a wrapped result
type ExtractResult<T> = T extends WrappedResult<infer R> ? R : never;

// Extract the result type from an API call
export type ApiResult<T> = T extends (...args: any) => Promise<WrappedResult<infer R>> ? R : never;

// Extract the input parameters type from an API call
export type ApiInput<T> = T extends (...args: infer P) => any ? P[0] : never;

export type Client<T> = ReturnType<typeof createClient<T>>

type ClientOptions<OkType = unknown, ErrorType = unknown> = {
  baseUrl?: string
  accessToken?: string,
  ok?: (data: unknown) => OkType,
  error?: (error: unknown) => ErrorType
}

class BaseClient<OkType = unknown, ErrorType = unknown> {
  constructor(private opts: ClientOptions<OkType, ErrorType> = {}) {}

  async request(
    method: HTTPMethod,
    path: string,
    options?: {
      params?: Record<string, unknown>;
      body?: unknown;
      query?: Record<string, unknown>;
      headers?: Record<string, string>;
    }
  ): Promise<WrappedResult<OkType, ErrorType>> {
    const filledPath = options?.params
      ? path.replace(/:([A-Za-z]+)/g, (_, param) => String(options.params![param]))
      : path;

    const url = typeof window !== 'undefined' 
      ? new URL([this.opts.baseUrl || window.location.origin, filledPath].join('')) 
      : new URL([this.opts.baseUrl, filledPath].join(''));
    
    if (options?.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const headers: Record<string, string> = Object.assign({}, options?.headers || {}, this.opts.accessToken ? { 'authorization': `bearer ${this.opts.accessToken}` } : {})
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
        const error = await response.json().catch(() => null);
        throw error
      }

      const data = response.status === 204 ? undefined : await response.json();

      if (this.opts.ok) {
        const customResult = this.opts.ok(data)
        return {
          success: true,
          error: null,
          result: customResult
        } as WrappedSuccess<OkType>;
      }
      
      // Default wrapping if no custom ok function provided
      return {
        success: true,
        error: null,
        result: data
      } as WrappedSuccess<OkType>;
    } catch (error) {

      if (this.opts.error) {
        const customError = this.opts.error(error)
        return {
          success: false,
          result: null,
          error: customError
        } as WrappedError<ErrorType>;
      }
      
      // Default error wrapping if no custom error function provided
      return {
        success: false,
        result: null,
        error: error
      } as WrappedError<ErrorType>;
    }
  }
}

class MethodProxyHandler<Schema, OkType, ErrorType> implements ProxyHandler<object> {
  constructor(
    private client: BaseClient<OkType, ErrorType>,
    private path: string
  ) {}

  get(target: object, method: string) {
    if (typeof method === 'string' && ['get', 'post', 'patch', 'put', 'delete'].includes(method.toLowerCase())) {
      return (options?: { params?: Record<string, unknown>; body?: unknown; query?: Record<string, unknown> }) =>
        this.client.request(method.toUpperCase() as HTTPMethod, this.path, options);
    }
    return Reflect.get(target, method);
  }
}

class PathProxyHandler<Schema, OkType, ErrorType> implements ProxyHandler<BaseClient<OkType, ErrorType>> {
  get(target: BaseClient<OkType, ErrorType>, path: string) {
    if (typeof path === 'string') {
      return new Proxy({}, new MethodProxyHandler(target, path));
    }
    return Reflect.get(target, path);
  }
}

export function createClient<
  Schema extends unknown,
  T extends ClientOptions<any, any> = ClientOptions
>(
  opts: T
): APIClientPaths<
  Schema, 
  T extends { ok: (data: unknown) => infer O } ? O : unknown,
  T extends { error: (error: unknown) => infer E } ? E : unknown
> {
  const client = new BaseClient<
    T extends { ok: (data: unknown) => infer O } ? O : unknown,
    T extends { error: (error: unknown) => infer E } ? E : unknown
  >(opts);
  return new Proxy(client, new PathProxyHandler<
    Schema, 
    T extends { ok: (data: unknown) => infer O } ? O : unknown,
    T extends { error: (error: unknown) => infer E } ? E : unknown
  >()) as unknown as APIClientPaths<
    Schema, 
    T extends { ok: (data: unknown) => infer O } ? O : unknown,
    T extends { error: (error: unknown) => infer E } ? E : unknown
  >;
}