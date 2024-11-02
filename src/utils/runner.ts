import { detectLanguage, getLanguageConfig } from "../config/config";
import { TestRunRequest, TestResult } from "../models/types";
import { cloneRepository, cleanupRepository } from "./gitUtils";
import { reportResults } from "./resultReporter";
import { buildDockerImage, runInDocker, cleanupDocker } from "./dockerUtils";
import { loadTestFile } from "./testLoader";
import { fetchUserProgress } from "./progress";
import { EVENT_TYPE } from "./constants";
import logger from "./logger";
import fs from "fs/promises";
import path from "path";
import { ProgressResponse } from "../models/types";

export async function runTestProcess(request: TestRunRequest): Promise<void> {
  const { repoUrl, branch, commitSha, challengeId } = request;
  let repoDir: string | null = null;
  let imageName: string | null = null;

  try {
    // Fetch user's progress
    const progressArray: ProgressResponse[] = await fetchUserProgress(repoUrl);
    if (progressArray.length === 0) {
      throw new Error("No progress data found for the repository.");
    }
    const progress = progressArray[0];
    console.log("Progress", progress);
    logger.info("Retrieved user progress", { progress, commitSha });

    // Check if the status is "not_started"
    if (progress.status === "not_started") {
      const testResult: TestResult = {
        event_type: EVENT_TYPE,
        repoUrl,
        commitSha,
        success: true,
        output: "Challenge setup completed successfully.",
      };
      await reportResults(commitSha, testResult);
      return;
    }

    // Clone repository
    repoDir = await cloneRepository(repoUrl, branch, commitSha);
    logger.info("Repository cloned", { repoDir, commitSha });

    // Detect language and get config
    const language = detectLanguage(repoDir);
    const languageConfig = getLanguageConfig(language);
    imageName = `test-image-${commitSha}`;

    // Load and write test file
    const testContent = await loadTestFile(
      challengeId,
      language,
      progress.progress_details.current_step,
    );

    // Create test directory and write test file
    const testDir = path.join(repoDir, ".hxckr", "tests");
    await fs.mkdir(testDir, { recursive: true });

    const testFileName = `current${getTestExtension(language)}`;
    await fs.writeFile(path.join(testDir, testFileName), testContent);
    logger.info("Test file written", { testFileName });

    // Build Docker image
    await buildDockerImage(repoDir, imageName, languageConfig.dockerfilePath);

    // Run the tests
    logger.info("Starting test execution", {
      commitSha,
      stage: progress.progress_details.current_step,
    });

    const testOutput = await runInDocker(imageName, languageConfig.runCommand);
    logger.info("Test execution completed", { commitSha });
    logger.info("Test output:", { testOutput });

    const testResult: TestResult = {
      event_type: EVENT_TYPE,
      repoUrl,
      commitSha,
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
      repoUrl,
      commitSha,
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

function getTestExtension(language: string): string {
  const extensions: Record<string, string> = {
    typescript: ".test.ts",
    // I will add more languages as needed
  };
  return extensions[language] || ".test";
}
