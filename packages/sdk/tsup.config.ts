
import { defineConfig } from "tsup";

export default defineConfig({
    entry: ['src/index.ts', 'src/react.tsx'],
    splitting: false,
    sourcemap: true,
    clean: true,
    dts: true, // Generate declaration files
    format: ['cjs', 'esm'], // Generate CommonJS and ESM
})
