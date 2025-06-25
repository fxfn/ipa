type SchemaType = {
  type: string
  format?: string
  nullable?: boolean
  items?: SchemaType
  properties?: Record<string, SchemaType>
  additionalProperties?: boolean | SchemaType
  required?: string[]
  anyOf?: SchemaType[]
  oneOf?: SchemaType[]
}

// Forward declaration for recursion
export function transformType(type: SchemaType): any {
  function getType(type: SchemaType): any {
    // Handle anyOf/oneOf (union types)
    if (type.anyOf || type.oneOf) {
      const unionTypes = type.anyOf || type.oneOf || []
      const transformedTypes = unionTypes.map((t: SchemaType) => transformType(t))
      // Use a special marker for union types
      return { __union: transformedTypes }
    }

    switch (type.type) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
        if (type.properties) {
          const obj: Record<string, any> = {};
          for (const [key, value] of Object.entries(type.properties)) {
            // Handle nullable properties at the property level
            if (value.nullable) {
              obj[key] = { __nullable: true, value: transformType({ ...value, nullable: false }) };
            } else {
              obj[key] = transformType(value);
            }
          }
          return obj;
        } else if (type.additionalProperties) {
          if (typeof type.additionalProperties === 'boolean') {
            return { '[key: string]': 'any' };
          } else {
            return { '[key: string]': transformType(type.additionalProperties) };
          }
        } else {
          return { '[key: string]': 'any' };
        }
      case 'array':
        if (type.items) {
          return [transformType(type.items)];
        } else {
          return ['any'];
        }
      default:
        return 'any';
    }
  }

  let result = getType(type);
  if (type.nullable) {
    // Represent nullable as a union type in the serializer
    result = { __nullable: true, value: result };
  }
  return result;
}

export function transformTypes(types: Record<string, SchemaType>) {
  const result: Record<string, any> = {};
  for (const key in types) {
    result[key] = transformType(types[key]);
  }
  return result;
}
