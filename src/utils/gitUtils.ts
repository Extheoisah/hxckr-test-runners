import { exec } from "child_process";
import fs from "fs-extra";
import path from "path";
import util from "util";

const execAsync = util.promisify(exec);

export async function cloneRepository(
  repoUrl: string,
  branch: string,
  commitSha: string,
): Promise<string> {
  const repoName = repoUrl.split("/").pop()?.replace(".git", "") || "repo";
  const cloneDir = path.join(
    __dirname,
    "..",
    "temp",
    `${repoName}-${commitSha}`,
  );

  try {
    await fs.ensureDir(cloneDir);
    console.log(`Cloning repository to ${cloneDir}`);
    await execAsync(`git clone --branch ${branch} ${repoUrl} ${cloneDir}`);
    console.log(`Checking out commit ${commitSha}`);
    await execAsync(`git checkout ${commitSha}`, { cwd: cloneDir });

    // Ensure .hxckr directory exists
    const hxckrDir = path.join(cloneDir, ".hxckr");
    await fs.ensureDir(hxckrDir);

    // Check if run.sh exists and make it executable
    const runShPath = path.join(hxckrDir, "run.sh");
    if (await fs.pathExists(runShPath)) {
      await execAsync(`chmod +x ${runShPath}`);
    } else {
      console.log("run.sh not found in the .hxckr directory");
    }

    console.log("Repository setup completed successfully");
    return cloneDir;
  } catch (error: any) {
    console.error(`Error setting up repository: ${error.message}`);
    throw error;
  }
}

export async function cleanupRepository(dir: string): Promise<void> {
  await fs.remove(dir);
}
