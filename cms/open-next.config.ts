// Required by `@opennextjs/cloudflare` (the `opennextjs-cloudflare build` CLI
// refuses to run without this file). Not called out in the original task
// brief -- the brief predates this requirement in the installed adapter
// version (1.20.1). Kept minimal: no incremental cache override, since this
// task only needs the SSR skeleton to build/deploy, not caching.
import { defineCloudflareConfig } from '@opennextjs/cloudflare'

export default defineCloudflareConfig()
