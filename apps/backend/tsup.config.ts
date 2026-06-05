import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  clean: true,
  noExternal: ['nanoid', 'better-auth', 'creator-agent-orchestrator'],
})
