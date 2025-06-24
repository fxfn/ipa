import { transformType } from "./transform-type.js";

function isValidIdentifier(key: string): boolean {
  // TypeScript identifier: starts with letter/_, then letter/number/_
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(key);
}

function isNullableWrapper(val: any): val is { __nullable: true, value: any } {
  return val && typeof val === 'object' && '__nullable' in val && 'value' in val;
}

function serializeType(value: any, indent: number = 0): string {
  const spaces = '  '.repeat(indent);

  // Handle nullable at the root
  if (isNullableWrapper(value)) {
    return serializeType(value.value, indent) + ' | null | undefined';
  }

  // Handle primitives
  if (typeof value === 'string') {
    return value;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return 'any[]';
    return serializeType(value[0], indent) + '[]';
  }

  // Guard for null/undefined before using Object.keys
  if (!value || typeof value !== 'object') {
    return 'any';
  }

  // Handle objects
  // Index signature
  if (Object.keys(value).length === 1 && Object.keys(value)[0] === '[key: string]') {
    return `Record<string, ${serializeType(value['[key: string]'], indent)}>`;
  }
  
  const entries = Object.entries(value);
  if (entries.length === 0) return '{}';
  
  const lines = entries.map(([key, val]) => {
    if (key === '__nullable') return undefined; // skip
    const propName = isValidIdentifier(key) ? key : `"${key}"`;
    // If the property is nullable, apply the union at the property level
    let serializedVal;
    if (isNullableWrapper(val)) {
      serializedVal = serializeType(val.value, indent + 1) + ' | null | undefined';
    } else {
      serializedVal = serializeType(val, indent + 1);
    }
    return `${spaces}  ${propName}: ${serializedVal}`;
  }).filter(Boolean);
  
  return '{\n' + lines.join(',\n') + '\n' + spaces + '}';
}

export function transformEndpoints(endpoints: Endpoint[]) {
  const result: Record<string, any> = {};

  for (const endpoint of endpoints) {
    const url = endpoint.url;
    const method = endpoint.method.toUpperCase();

    // Transform body and response schemas to plain JS types
    // GET requests should not have a body
    const transformedBody = method === 'GET' ? undefined : (endpoint.body ? transformType(endpoint.body) : undefined);
    const transformedResponse: Record<string, any> = {};

    if (endpoint.response) {
      for (const [status, schema] of Object.entries(endpoint.response)) {
        transformedResponse[status] = schema ? transformType(schema) : null;
      }
    }

    const definition = {
      ...(endpoint.query && { query: endpoint.query }),
      ...(transformedBody !== undefined && { body: transformedBody }),
      response: transformedResponse,
    };

    if (result[url]) {
      result[url][method] = definition;
    } else {
      result[url] = {
        [method]: definition,
      };
    }
  }

  return serializeType(result, 0);
}