import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export interface LanguageConfig {
  language: string;
  setupCommands: string[];
  runCommand: string;
  nixShell: string;
}

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  typescript: {
    language: "typescript",
    setupCommands: ["bun install"],
    runCommand: "", // We'll use the .hxckr/run.sh script instead since it points to the main.ts file for the user
    nixShell: path.join(
      __dirname,
      "..",
      "supportedLanguageShell",
      "typescript-shell.nix",
    ),
  },
  // will add oher languages as needed
};

export function getLanguageConfig(repoDir: string): LanguageConfig {
  // Check for TypeScript/JavaScript project
  if (fs.existsSync(path.join(repoDir, "package.json"))) {
    return LANGUAGE_CONFIGS.typescript;
  }

  // will add checks for other languages here

  throw new Error("Unsupported language");
}

export const config = {
  port: process.env.PORT,
  //oher config can go here
};

// this is helper function to get the Nix shell file for a language
export function getNixShellFile(language: string): string {
  const langConfig = LANGUAGE_CONFIGS[language];
  if (!langConfig) {
    throw new Error(`Unsupported language: ${language}`);
  }
  return langConfig.nixShell;
}
