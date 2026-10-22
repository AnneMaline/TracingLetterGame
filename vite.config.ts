import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { runnerImport, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The Curious Reader container opens index.html from file://, where Chrome/WebView block
// module scripts and `crossorigin` requests. Ship a classic deferred script instead.
function classicScriptForFileProtocol(): Plugin {
  return {
    name: "classic-script-for-file-protocol",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler: (html) =>
        html
          .replace(/<script type="module"/g, "<script defer")
          .replace(/\s+crossorigin(?=[\s>])/g, ""),
    },
  };
}

// Serializes src/data/languagePacks.ts to lang/<langCode>/letters.json: served in dev,
// emitted into dist/ on build, then split into per-language ZIPs by scripts/package-cms.mjs.
async function loadLanguagePackFiles() {
  const { module } = await runnerImport<
    typeof import("./src/data/languagePacks")
  >(fileURLToPath(new URL("./src/data/languagePacks.ts", import.meta.url)));
  return Object.entries(module.languagePacks).map(([langCode, content]) => ({
    fileName: `lang/${langCode}/letters.json`,
    source: JSON.stringify(content),
  }));
}

function languagePackFiles(): Plugin {
  return {
    name: "language-pack-files",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split("?")[0] ?? "";
        if (!/^\/lang\/[a-z0-9-]+\/letters\.json$/.test(path)) return next();
        // Re-read on every request so edits to letter data show up on reload.
        loadLanguagePackFiles().then((files) => {
          const file = files.find((f) => path === `/${f.fileName}`);
          if (!file) return next();
          res.setHeader("Content-Type", "application/json");
          res.end(file.source);
        }, next);
      });
    },
    async generateBundle() {
      for (const file of await loadLanguagePackFiles()) {
        this.emitFile({ type: "asset", ...file });
      }
    },
  };
}

export default defineConfig({
  // Relative asset URLs: absolute "/assets/..." resolves to the filesystem root under file://.
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    classicScriptForFileProtocol(),
    languagePackFiles(),
  ],
  build: {
    sourcemap: false,
    modulePreload: false,
    rolldownOptions: {
      output: { format: "iife" },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
