import { resolveRef } from "./resolve-ref.js"

type ParameterV2 = {
  name: string
  in: 'query' | 'path' | 'body'
  type?: string
  schema?: any
  required?: boolean
}

export function resolveParametersV2(type: 'query' | 'path', parameters: ParameterV2[], schemas: Record<string, any>) {
  if (!parameters) {
    return null
  }

  const result: Record<string, any> = {}
  for (const parameter of parameters) {
    if (parameter.in === type) {
      if (parameter.schema) {
        // If parameter has a schema, resolve it (for complex types)
        result[parameter.name] = resolveRef(parameter.schema, schemas, new Set())
      } else if (parameter.type) {
        // If parameter has a direct type (for simple types like string, number, etc.)
        result[parameter.name] = { type: parameter.type }
      }
    }
  }

  // Return null if no parameters of the specified type were found
  return Object.keys(result).length > 0 ? result : null
} 