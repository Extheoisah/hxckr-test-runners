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
  private lastUpdate: number = 0;
  private readonly updateInterval = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    // Initialize repoDir to a fixed location
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
      // Check if directory exists
      const exists = await fs
        .access(this.repoDir!)
        .then(() => true)
        .catch(() => false);

      if (!exists) {
        // First time: Clone the repository
        await fs.mkdir(this.repoDir!, { recursive: true });
        await execAsync(
          `git clone -b ${TEST_REPO_CONFIG.branch} ${TEST_REPO_CONFIG.repoUrl} ${this.repoDir}`,
        );
        logger.info("Test repository cloned successfully");
      }
    } catch (error) {
      logger.error("Error initializing test repository", { error });
      throw error;
    }
  }

  private async updateRepo(): Promise<void> {
    try {
      await execAsync(`cd ${this.repoDir} && git pull`);
      logger.info("Test repository updated successfully");
    } catch (error) {
      logger.error("Error updating test repository", { error });
      throw error;
    }
  }

  public static getTestExtension(language: string): string {
    const extensions: Record<string, string> = {
      typescript: ".test.ts",
      rust: ".test.rs",
      // Add more languages as needed
    };
    return extensions[language] || ".test";
  }

  private async ensureRepoUpdated(): Promise<string> {
    const now = Date.now();

    try {
      // Initialize repo if it doesn't exist
      await this.initializeRepo();

      // Update repo if needed
      if (now - this.lastUpdate > this.updateInterval) {
        await this.updateRepo();
        this.lastUpdate = now;
      }

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
      return await fs.readFile(testPath, "utf-8");
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

  // We don't need cleanup anymore since we're keeping the repo
  // But we might want a method to force update
  public async forceUpdate(): Promise<void> {
    try {
      await this.updateRepo();
      this.lastUpdate = Date.now();
    } catch (error) {
      logger.error("Error forcing update", { error });
      throw error;
    }
  }
}
