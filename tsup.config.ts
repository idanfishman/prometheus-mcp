import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["esm"],
  target: "node20.19",
  minify: process.env.NODE_ENV === "production",
  dts: false,
  sourcemap: false,
  splitting: false,
  bundle: true,
  clean: true,
  treeshake: true,
  banner: {
    js: "#!/usr/bin/env node",
  },
  platform: "node",
});
