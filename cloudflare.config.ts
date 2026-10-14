import { defineConfig } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

export default defineConfig({
  worker: {
    name: "artifacts-playground",
    entrypoint,
    compatibilityDate: "2026-10-14",
    env: {
      ARTIFACTS: { type: "artifacts", namespace: "playground", dev: { remote: false } },
    },
  },
});
