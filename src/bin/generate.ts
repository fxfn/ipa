#!/usr/bin/env node

import { generate } from "../server.js"
import { writeFileSync, mkdirSync } from "node:fs"
import { kebabCase } from "../lib/casing.js"

function help() {
  console.log(`
Usage:
  npx @fxfn/ipa <url> <domain>

Example:
  npx @fxfn/ipa http://localhost:3000/api/swagger.json MyService
  `.replace('    ', ''))
}

async function main(args: string[]) {
  if (args.includes('--help') || args.includes('-h')) {
    help()
    return
  }
  
  const [url, domain] = args
  if (!url || !domain) {
    console.error('Error: Missing required arguments')
    help()
    process.exit(1)
  }

  try {
    const schema = await generate({ url, domain })
    
    // Create schemas directory if it doesn't exist
    mkdirSync('./schemas', { recursive: true })
    
    writeFileSync(`./schemas/${kebabCase(domain)}.ts`, schema)
    console.log(`✅ Generated schema: ./schemas/${kebabCase(domain)}.ts`)
  } catch (error) {
    console.error('Error generating schema:', error)
    process.exit(1)
  }
}

main(process.argv.slice(2))