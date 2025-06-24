import { transformEndpoints } from "./lib/transform-endpoints.js"
import { resolveRef } from "./lib/resolve-ref.js"
import { resolveParameters } from "./lib/resolve-parameters.js"
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

  const endpoints: Endpoint[] = []

  for (const path in json.paths) {
    const data = json.paths[path]
    for (const method in data) {
      const { tags, summary, description, parameters, requestBody, responses } = data[method]
      
      // Ensure schemas exist and handle null parameters
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

  return `
/**
 * GENERATED FILE
 * DO NOT EDIT
 */

export type ${pascalCase(domain)} = ${transformEndpoints(endpoints)}
  `
}
