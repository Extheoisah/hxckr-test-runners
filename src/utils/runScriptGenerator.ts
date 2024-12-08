import path from "path";
import fs from "fs/promises";

export async function generateRunScript(
  repoDir: string,
  language: string,
  currentStep: number,
  testContent: string | null,
): Promise<void> {
  const runScript = `#!/bin/bash
set -e  # Exit on any error

${generateCommandForLanguage(language, currentStep, testContent)}
`;

  const runScriptPath = path.join(repoDir, ".hxckr", "run.sh");
  await fs.writeFile(runScriptPath, runScript);
  await fs.chmod(runScriptPath, 0o755);
}

function generateCommandForLanguage(
  language: string,
  currentStep: number,
  testContent: string | null,
): string {
  switch (language) {
    case "python":
      return `pytest ./app/stage${currentStep}_test.py -v`;
    case "rust":
      return `cargo build --quiet &&
              cargo test ${
                testContent
                  ? `--test stage${currentStep}_test`
                  : `--test stage${currentStep}`
              }`;
    case "typescript":
      return `bun test ./app/stage${currentStep}.test.ts`;
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}
