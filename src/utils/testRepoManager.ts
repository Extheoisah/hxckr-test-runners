import { TEST_REPO_CONFIG } from "../config/config";
import { exec } from "child_process";
import util from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import logger from "./logger";

const execAsync = util.promisify(exec);

export class TestRepoManager {
  private static instance: TestRepoManager;
  private repoDir: string | null = null;

  private constructor() {
    this.repoDir = path.join(os.tmpdir(), "hxckr-test-repo");
  }

  public static getInstance(): TestRepoManager {
    if (!TestRepoManager.instance) {
      TestRepoManager.instance = new TestRepoManager();
    }
    return TestRepoManager.instance;
  }

  private async initializeRepo(): Promise<void> {
    try {
      await fs.mkdir(this.repoDir!, { recursive: true });
      const isGitRepo = await fs
        .access(path.join(this.repoDir!, ".git"))
        .then(() => true)
        .catch(() => false);

      if (!isGitRepo) {
        await execAsync(
          `git clone -b ${TEST_REPO_CONFIG.branch} ${TEST_REPO_CONFIG.repoUrl} ${this.repoDir}`,
        );
        logger.info("Test repository cloned successfully");
      } else {
        await execAsync(`cd ${this.repoDir} && git pull`);
        logger.info("Test repository updated successfully");
      }
    } catch (error) {
      logger.error("Error initializing test repository", { error });
      throw error;
    }
  }

  public static getTestExtension(language: string): string {
    const extensions: Record<string, string> = {
      typescript: ".test.ts",
      rust: "_test.rs",
      python: "_test.py",
      // Add more languages as needed
    };
    return extensions[language] || ".test";
  }

  private async ensureRepoUpdated(): Promise<string> {
    try {
      await this.initializeRepo();
      return this.repoDir!;
    } catch (error) {
      logger.error("Error ensuring repo is updated", { error });
      throw error;
    }
  }

  public async getTestContent(
    challengeId: string,
    language: string,
    stage: number,
  ): Promise<string> {
    const repoDir = await this.ensureRepoUpdated();
    const testPath = path.join(
      repoDir,
      TEST_REPO_CONFIG.testsPath,
      challengeId,
      language,
      `stage${stage}${TestRepoManager.getTestExtension(language)}`,
    );

    try {
      const content = await fs.readFile(testPath, "utf-8");
      logger.info("Test content retrieved successfully");
      return content;
    } catch (error) {
      logger.error("Error reading test file", {
        testPath,
        error,
        challengeId,
        language,
        stage,
      });
      throw new Error(`Test file not found: ${testPath}`);
    }
  }

  public async forceUpdate(): Promise<void> {
    try {
      await execAsync(`cd ${this.repoDir} && git pull`);
      logger.info("Test repository force updated successfully");
    } catch (error) {
      logger.error("Error forcing update", { error });
      throw error;
    }
  }
}
