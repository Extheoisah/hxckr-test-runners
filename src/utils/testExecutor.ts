import { exec } from "child_process";
import fs from "fs-extra";
import path from "path";
import util from "util";
import { TestStage, TestResult } from "../models/types";

const execAsync = util.promisify(exec);

export async function runTests(
  repoDir: string,
  stages: TestStage[],
): Promise<TestResult> {
  let output = "";

  for (const stage of stages) {
    try {
      let command = stage.command;
      if (stage.name === "Run Program") {
        const yourProgramPath = path.join(repoDir, "your_program.sh");
        if (await fs.pathExists(yourProgramPath)) {
          command = `${yourProgramPath} ${command}`;
        } else {
          throw new Error("your_program.sh not found");
        }
      }
      console.log(`Executing command: ${command}`);
      const { stdout, stderr } = await execAsync(command, { cwd: repoDir });
      output += `\n--- ${stage.name} ---\n${stdout}\n${stderr}\n`;
    } catch (error: any) {
      console.error(`Error in stage "${stage.name}":`, error);
      return {
        success: false,
        output,
        errorMessage: `Error in stage "${stage.name}": ${error.message}`,
      };
    }
  }

  return { success: true, output };
}
