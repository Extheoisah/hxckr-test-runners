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
import { TestRepoManager } from "./testRepoManager";

export async function runTestProcess(request: TestRunRequest): Promise<void> {
  const { repoUrl, branch, commitSha } = request;

  let repoDir: string | null = null;
  let imageName: string | null = null;

  try {
    // Fetch user's progress
    const progressData: ProgressResponse = await fetchUserProgress(repoUrl);
    if (!progressData) {
      throw new Error("No progress data found for the repository.");
    }
    const progress = progressData;
    logger.info("Retrieved user progress", { progress, commitSha });

    const challengeId = progress.challenge_id;
    if (!challengeId) {
      throw new Error("Challenge ID not found in progress data.");
    }
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

    if (language === "rust") {
      const testsDir = path.join(repoDir, "tests");
      await fs.mkdir(testsDir, { recursive: true });
      const testFileName = `stage${progress.progress_details.current_step}${TestRepoManager.getTestExtension(language)}`;
      await fs.writeFile(path.join(testsDir, testFileName), testContent);
    } else {
      const appDir = path.join(repoDir, "app");
      await fs.mkdir(appDir, { recursive: true });
      const testFileName = `stage${progress.progress_details.current_step}${TestRepoManager.getTestExtension(language)}`;
      await fs.writeFile(path.join(appDir, testFileName), testContent);
    }

    // Create run.sh with modified commands
    const runScript = `#!/bin/bash
    set -e  # Exit on any error

    if [ -f "requirements.txt" ]; then
        # For Python projects
        pytest ./app/stage${progress.progress_details.current_step}${TestRepoManager.getTestExtension(language)} -v
    elif [ -f "Cargo.toml" ]; then
        # For Rust projects
        # Build first (quietly)
        cargo build > /dev/null 2>&1
        # Run tests and show only test output
        cargo test --test stage${progress.progress_details.current_step}_test
    else
        # For TypeScript projects
        bun test ./app/stage${progress.progress_details.current_step}${TestRepoManager.getTestExtension(language)}
    fi
    `;

    const runScriptPath = path.join(repoDir, ".hxckr", "run.sh");
    await fs.writeFile(runScriptPath, runScript);
    await fs.chmod(runScriptPath, 0o755); // Make executable

    // Build Docker image
    await buildDockerImage(repoDir, imageName, languageConfig.dockerfilePath);

    // Run the tests
    logger.info("Starting test execution", {
      commitSha,
      stage: progress.progress_details.current_step,
    });

    const testResult = await runInDocker(imageName, languageConfig.runCommand);
    logger.info("Test execution completed", { commitSha });
    logger.info("Test output:", {
      stdout: testResult.stdout,
      stderr: testResult.stderr,
      exitCode: testResult.exitCode,
    });

    // Success is now determined by exit code(using this to avoid having to parse stdout/stderr for success/failure)
    const success = testResult.exitCode === 0;
    const output = success
      ? testResult.stdout
      : `${testResult.stderr}\n${testResult.stdout}`;

    const result: TestResult = {
      event_type: EVENT_TYPE,
      repoUrl,
      commitSha,
      success,
      output: output.trim(),
    };
    await reportResults(commitSha, result);
  } catch (error: any) {
    logger.error("Error during test process", { error, commitSha });
    const errorMessage =
      error.stderr || error.message || "Unknown error occurred";
    await reportResults(commitSha, {
      event_type: EVENT_TYPE,
      repoUrl,
      commitSha,
      success: false,
      output: error.stdout || "",
      errorMessage: `Test execution failed: ${errorMessage}`,
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

// function isTestSuccessful(output: string): boolean {
//   if (output.includes("running")) {
//     // For Rust tests
//     return (
//       !output.includes("test result: FAILED") &&
//       !output.includes("panicked at") &&
//       !output.includes("failures:")
//     );
//   } else if (output.includes("pytest")) {
//     // For Python tests
//     const hasFailed =
//       output.includes(" FAILED ") ||
//       output.includes("= FAILURES =") ||
//       output.includes(" ERROR ") ||
//       output.includes("!!!!!!!!!!!!!!!!!!!! Interrupted:");
//     return !hasFailed;
//   } else {
//     // For TypeScript tests
//     const failMatch = output.match(/(\d+)\s+fail/);
//     const failCount = failMatch ? parseInt(failMatch[1]) : 0;
//     return failCount === 0;
//   }
// }

// function cleanTestOutput(output: string): string {
//   if (output.includes("running")) {
//     // For Rust tests
//     const lines = output.split("\n");
//     const relevantLines = lines.filter(
//       (line) =>
//         line.includes("running") ||
//         line.includes("test test_") ||
//         (line.includes("test result:") && !line.includes("Running")),
//     );
//     return relevantLines.join("\n").trim();
//   } else if (output.includes("pytest")) {
//     // For Python tests
//     return output.trim();
//   } else {
//     // For TypeScript tests
//     const testRunMatch = output.match(
//       /app\/stage\d+\.test\.ts:[\s\S]+?Ran \d+ tests across \d+ files\./,
//     );
//     if (testRunMatch) {
//       return testRunMatch[0].trim();
//     }
//     return output.trim();
//   }
// }
