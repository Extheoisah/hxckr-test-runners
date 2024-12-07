import { TestRepoManager } from "./testRepoManager";
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

  if [ -f "requirements.txt" ]; then
      # For Python projects
      ${
        testContent
          ? `pytest ./app/stage${currentStep}${TestRepoManager.getTestExtension(language)} -v`
          : "python ./app/main.py"
      }
  elif [ -f "Cargo.toml" ]; then
      # For Rust projects
      cargo build ${testContent ? "--quiet" : ""}
      ${
        testContent ? `cargo test --test stage${currentStep}_test` : "cargo run"
      }
  else
      # For TypeScript projects
      ${
        testContent
          ? `bun test ./app/stage${currentStep}${TestRepoManager.getTestExtension(language)}`
          : "bun run start"
      }
  fi
  `;

  const runScriptPath = path.join(repoDir, ".hxckr", "run.sh");
  await fs.writeFile(runScriptPath, runScript);
  await fs.chmod(runScriptPath, 0o755); // Making it executable
}
