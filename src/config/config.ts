import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

export interface LanguageConfig {
  language: string;
  dockerfilePath: string;
  runCommand: string;
}

export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  typescript: {
    language: "typescript",
    dockerfilePath: path.join(
      __dirname,
      "../../supportedLanguageDockerfiles/typescript/Dockerfile",
    ),
    runCommand: "/app/.hxckr/run.sh",
  },
  rust: {
    language: "rust",
    dockerfilePath: path.join(
      __dirname,
      "../../supportedLanguageDockerfiles/rust/Dockerfile",
    ),
    runCommand: "/app/.hxckr/run.sh",
  },
  // Add other languages as needed
};

export function detectLanguage(repoDir: string): string {
  if (fs.existsSync(path.join(repoDir, "package.json"))) {
    return "typescript";
  }
  if (fs.existsSync(path.join(repoDir, "Cargo.toml"))) {
    return "rust";
  }
  throw new Error("Unsupported language");

  // going to add other language detection logic as needed
}

export function getLanguageConfig(language: string): LanguageConfig {
  const config = LANGUAGE_CONFIGS[language];
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }
  return config;
}

export const config = {
  port: process.env.PORT || 3001,
};
