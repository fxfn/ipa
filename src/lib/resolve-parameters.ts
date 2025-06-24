import { resolveRef } from "./resolve-ref.js"

type Parameter = {
  name: string
  in: 'query' | 'path',
  schema: any
}

export function resolveParameters(type: 'query' | 'path', parameters: Parameter[], schemas: Record<string, any>) {
  if (!parameters) {
    return null
  }

  const result: Record<string, any> = {}
  for (const parameter of parameters) {
    if (parameter.in === type) {
      if (parameter.schema) {
        result[parameter.name] = resolveRef(parameter.schema, schemas, new Set())
      }
    }
  }

  // Return null if no parameters of the specified type were found
  return Object.keys(result).length > 0 ? result : null
}