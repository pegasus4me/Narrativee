import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "migrate-brands": "scripts/migrate-brands.ts",
  },
  format: ["cjs"],
  clean: true,
  noExternal: ["nanoid", "better-auth"],
});
