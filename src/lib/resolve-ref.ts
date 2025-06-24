type MaybeRefSchema = {
  $ref?: string
}

export function resolveRef(schema: MaybeRefSchema, schemas: Record<string, any>, visited: Set<string> = new Set()) {
  if (schema && schema.$ref) {
    const ref = schema.$ref
    const [, path] = ref.split('#/components/schemas/')
    
    // Check for circular references
    if (visited.has(path)) {
      return { $ref: `#/components/schemas/${path}` }
    }
    
    visited.add(path)

    const resolvedSchema = schemas[path]

    // iterate over the schema and resolve all child refs
    const properties = resolvedSchema.properties
    if (properties) {
      for (const key in properties) {
        if ('$ref' in properties[key]) {
          properties[key] = resolveRef(properties[key], schemas, new Set(visited))
        }

        if (properties[key]?.type === 'array') {
          properties[key].items = resolveRef(properties[key].items, schemas, new Set(visited))
        }
      }
    }

    // Handle arrays at the top level of the resolved schema
    if (resolvedSchema.type === 'array' && resolvedSchema.items) {
      resolvedSchema.items = resolveRef(resolvedSchema.items, schemas, new Set(visited))
    }

    return resolvedSchema
  }

  return schema
}