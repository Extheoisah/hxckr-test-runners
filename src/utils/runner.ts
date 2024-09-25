import { getLanguageConfig } from "../config/config";
import { TestRunRequest, TestStage } from "../models/types";
import { cleanupRepository, cloneRepository } from "./gitUtils";
import { reportResults } from "./resultReporter";
import { runTests } from "./testExecutor";

export async function runTestProcess(request: TestRunRequest): Promise<void> {
  const { repoUrl, branch, commitSha } = request;
  let repoDir: string | null = null;

  try {
    repoDir = await cloneRepository(repoUrl, branch, commitSha);
    console.log(`Repository cloned to ${repoDir}`);
    const languageConfig = getLanguageConfig(repoDir);

    const TEST_STAGES: TestStage[] = [
      ...languageConfig.setupCommands.map((command) => ({
        name: "Setup",
        command,
      })),
      { name: "Run Program", command: languageConfig.runCommand },
    ];

    console.log("Starting test execution");
    const testResult = await runTests(
      repoDir,
      TEST_STAGES,
      languageConfig.language,
    );
    console.log("Test execution completed");
    await reportResults(commitSha, testResult);
  } catch (error: any) {
    console.error("Error during test process:", error);
    await reportResults(commitSha, {
      success: false,
      output: "",
      errorMessage: `Unhandled error: ${error.message}`,
    });
  } finally {
    if (repoDir) {
      await cleanupRepository(repoDir);
      console.log("Repository cleaned up");
    }
  }
}
