import fs from "fs";
import path from "path";
export const LANGUAGE_CONFIGS = {
  typescript: {
    setupCommands: ["bun install"],
    runCommand: "",
  },
  // we can add other languages we need here
};

export function getLanguageConfig(repoDir: string): {
  setupCommands: string[];
  runCommand: string;
} {
  // This is a simple check. we might need more method to determine the language
  if (fs.existsSync(path.join(repoDir, "package.json"))) {
    return LANGUAGE_CONFIGS.typescript;
  }
  throw new Error("Unsupported language");
}

export const config = {
  port: process.env.PORT || 3000,
  testRunnerUrl:
    process.env.TEST_RUNNER_URL || "http://localhost:3001/run-tests",
  coreServiceUrl:
    process.env.CORE_SERVICE_URL || "http://localhost:3004/webhook",
};
