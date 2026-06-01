import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    outputFile: "tmp/vitest.out.json",
    reporters: ["verbose"],
  },
});
