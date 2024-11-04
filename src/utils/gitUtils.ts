import { exec } from "child_process";
import fs from "fs-extra";
import path from "path";
import util from "util";
import logger from "./logger";

const execAsync = util.promisify(exec);

export async function cloneRepository(
  repoUrl: string,
  branch: string,
  commitSha: string | null = null,
): Promise<string> {
  const repoName = repoUrl.split("/").pop()?.replace(".git", "") || "repo";
  const cloneDir = path.join(
    __dirname,
    "..",
    "tmp",
    `${repoName}-${commitSha}`,
  );

  try {
    await fs.ensureDir(cloneDir);
    await execAsync(`git clone --branch ${branch} ${repoUrl} ${cloneDir}`);
    await execAsync(`git checkout ${commitSha}`, { cwd: cloneDir });

    // Ensure .hxckr directory exists
    const hxckrDir = path.join(cloneDir, ".hxckr");
    await fs.ensureDir(hxckrDir);

    // Check if run.sh exists and make it executable
    const runShPath = path.join(hxckrDir, "run.sh");
    if (await fs.pathExists(runShPath)) {
      await execAsync(`chmod +x ${runShPath}`);
    } else {
      logger.warn("run.sh not found in repository");
    }

    logger.info("Repository cloned", { cloneDir, commitSha });
    return cloneDir;
  } catch (error: any) {
    logger.error("Error cloning repository", { error });
    throw error;
  }
}

export async function cleanupRepository(dir: string): Promise<void> {
  await fs.remove(dir);
}
