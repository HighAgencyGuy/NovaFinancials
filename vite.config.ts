// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Custom SSR entry wraps TanStack Start with branded error pages.
// Nitro preset "vercel" produces dist/ output for Vercel deployment.
export default defineConfig({
  // Nitro preset "vercel" emits Build Output API artifacts under .output/
  nitro: {
    preset: "vercel",
    output: {
      dir: ".output",
      serverDir: ".output/server",
      publicDir: ".output/public",
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
