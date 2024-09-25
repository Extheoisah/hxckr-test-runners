import { TestStage, TestResult } from "../models/types";
import { runWithNix } from "./nixRunner";

export async function runTests(
  repoDir: string,
  stages: TestStage[],
  language: string,
): Promise<TestResult> {
  let output = "";

  for (const stage of stages) {
    try {
      console.log(`Executing stage: ${stage.name}`);
      const stageOutput = await runWithNix(language, repoDir, stage.command);
      output += `\n--- ${stage.name} ---\n${stageOutput}\n`;
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
