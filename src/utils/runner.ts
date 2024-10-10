import { detectLanguage, getLanguageConfig } from "../config/config";
import { TestRunRequest, TestResult } from "../models/types";
import { cloneRepository, cleanupRepository } from "./gitUtils";
import { reportResults } from "./resultReporter";
import { buildDockerImage, runInDocker, cleanupDocker } from "./dockerUtils";
import fs from "fs/promises";
import path from "path";

export async function runTestProcess(request: TestRunRequest): Promise<void> {
  const { repoUrl, branch, commitSha } = request;
  let repoDir: string | null = null;
  let imageName: string | null = null;

  try {
    repoDir = await cloneRepository(repoUrl, branch, commitSha);
    console.log(`Repository cloned to ${repoDir}`);

    const language = detectLanguage(repoDir);
    console.log(`Detected language: ${language}`);
    const languageConfig = getLanguageConfig(language);
    imageName = `test-image-${commitSha}`;

    // Log content of .hxckr/run.sh
    const runShPath = path.join(repoDir, ".hxckr", "run.sh");
    const runShContent = await fs.readFile(runShPath, "utf-8");
    console.log(".hxckr/run.sh content:", runShContent);

    // Build Docker image
    await buildDockerImage(repoDir, imageName, languageConfig.dockerfilePath);

    // Run the tests
    console.log("Starting test execution");
    const testOutput = await runInDocker(imageName, languageConfig.runCommand);
    console.log("Test execution completed");
    console.log("Test output:", testOutput);

    const testResult: TestResult = {
      success:
        !testOutput.toLowerCase().includes("error") &&
        !testOutput.toLowerCase().includes("failed"),
      output: testOutput,
    };

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
    if (imageName) {
      await cleanupDocker(imageName);
      console.log("Docker resources cleaned up");
    }
  }
}
