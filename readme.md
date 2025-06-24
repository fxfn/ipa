# @fxfn/ipa

Its an API but backwards.

---

Generate a typescript API Client from a swagger.json file.

## getting started (dev)

### generate a API Schema (MyService)

```bash
$ git clone https://github.com/fxfn/ipa
$ cd ipa
$ pnpm i
$ pnpm run generate http://localhost:3000/api/swagger.json MyService
```

### import @fxfn/ipa and create a client for MyService

```typescript
import { createClient } from "@fxfn/ipa"
import { MyService } from "./schema/my-service"

const client = createClient<MyService>({
  // see options
})

async function main() {
  const res = await client['/api/contacts'].get()
  console.log(res)
}

main()
```