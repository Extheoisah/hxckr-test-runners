import { detectLanguage, getLanguageConfig } from "../config/config";
import { TestRunRequest, TestResult } from "../models/types";
import { cloneRepository, cleanupRepository } from "./gitUtils";
import { reportResults } from "./resultReporter";
import { buildDockerImage, runInDocker, cleanupDocker } from "./dockerUtils";
// import fs from "fs/promises";
// import path from "path";
import { EVENT_TYPE } from "./constants";
import logger from "./logger";

export async function runTestProcess(request: TestRunRequest): Promise<void> {
  const { repoUrl, branch, commitSha } = request;
  let repoDir: string | null = null;
  let imageName: string | null = null;

  try {
    repoDir = await cloneRepository(repoUrl, branch, commitSha);
    logger.info("Repository cloned", { repoDir, commitSha });

    const language = detectLanguage(repoDir);
    const languageConfig = getLanguageConfig(language);
    imageName = `test-image-${commitSha}`;

    // Log content of .hxckr/run.sh, not necessary just for debugging
    // const runShPath = path.join(repoDir, ".hxckr", "run.sh");
    // const runShContent = await fs.readFile(runShPath, "utf-8");

    // Build Docker image
    await buildDockerImage(repoDir, imageName, languageConfig.dockerfilePath);

    // Run the tests
    logger.info("Starting test execution", { commitSha });
    const testOutput = await runInDocker(imageName, languageConfig.runCommand);
    logger.info("Test execution completed", { commitSha });
    logger.info("Test output:", { testOutput });

    const testResult: TestResult = {
      event_type: EVENT_TYPE,
      success:
        !testOutput.toLowerCase().includes("error") &&
        !testOutput.toLowerCase().includes("failed"),
      output: testOutput,
    };

    await reportResults(commitSha, testResult);
  } catch (error: any) {
    logger.error("Error during test process", { error, commitSha });
    await reportResults(commitSha, {
      event_type: EVENT_TYPE,
      success: false,
      output: "",
      errorMessage: `Unhandled error: ${error.message}`,
    });
  } finally {
    if (repoDir) {
      await cleanupRepository(repoDir);
      logger.info("Repository cleaned up");
    }
    if (imageName) {
      await cleanupDocker(imageName);
      logger.info("Docker resources cleaned up");
    }
  }
}
