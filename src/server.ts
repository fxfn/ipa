import { transformEndpoints } from "./lib/transform-endpoints.js"
import { resolveRef } from "./lib/resolve-ref.js"
import { resolveParameters } from "./lib/resolve-parameters.js"
import { resolveParametersV2 } from "./lib/resolve-parameters-v2.js"
import { transformTypes } from "./lib/transform-type.js"
import { pascalCase } from "./lib/casing.js"

type GenerateOptions = {
  url: string
  domain: string
}

export async function generate({
  url,
  domain,
}: GenerateOptions) {

  const schema = await fetch(url)
  const json = await schema.json() as any

  // Detect OpenAPI version
  const isV2 = json.swagger === "2.0"
  const isV3 = json.openapi && json.openapi.startsWith("3.")

  if (!isV2 && !isV3) {
    throw new Error("Unsupported OpenAPI version. Only v2 and v3 are supported.")
  }

  const endpoints: Endpoint[] = []

  for (const path in json.paths) {
    const data = json.paths[path]
    for (const method in data) {
      const { tags, summary, description, parameters, requestBody, responses } = data[method]
      
      if (isV2) {
        // Handle OpenAPI v2 structure
        const schemas = json.definitions || {}
        const resolvedQuery = resolveParametersV2('query', parameters || [], schemas)
        const resolvedParams = resolveParametersV2('path', parameters || [], schemas)
        
        // GET requests should not have a body
        const body = method.toLowerCase() === 'get' ? undefined : 
          (parameters || []).find((p: any) => p.in === 'body')?.schema
        
        endpoints.push({
          url: path,
          method,
          tags,
          summary,
          description,
          query: resolvedQuery ? transformTypes(resolvedQuery) : undefined,
          params: resolvedParams ? transformTypes(resolvedParams) : undefined,
          body,
          response: {
            200: responses['200']?.schema || null,
          }
        })
      } else {
        // Handle OpenAPI v3 structure (existing logic)
        const schemas = json.components?.schemas || {}
        const resolvedQuery = resolveParameters('query', parameters || [], schemas)
        const resolvedParams = resolveParameters('path', parameters || [], schemas)
        
        // GET requests should not have a body
        const body = method.toLowerCase() === 'get' ? undefined : 
          ('application/json' in (requestBody?.content || {})
            ? resolveRef(requestBody.content['application/json'].schema, schemas, new Set())
            : requestBody)
        
        endpoints.push({
          url: path,
          method,
          tags,
          summary,
          description,
          query: resolvedQuery ? transformTypes(resolvedQuery) : undefined,
          params: resolvedParams ? transformTypes(resolvedParams) : undefined,
          body,
          response: {
            200: 'application/json' in (responses['200']?.content || {}) 
              ? resolveRef(responses['200'].content['application/json'].schema, schemas, new Set())
              : null,
          }
        })
      }
    }
  }

  return `
/**
 * GENERATED FILE
 * DO NOT EDIT
 */

export type ${pascalCase(domain)} = ${transformEndpoints(endpoints)}
  `
}
