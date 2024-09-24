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
    await fs.ensureDir(path.join(cloneDir, ".hxckr"));

    // Check if run.sh exists
    const runShPath = path.join(cloneDir, ".hxckr", "run.sh");
    if (!(await fs.pathExists(runShPath))) {
      console.log("run.sh not found in the cloned repository");
    } else {
      // Check if run.sh is not already in the .hxckr directory
      const sourceRunShPath = path.join(cloneDir, "run.sh");
      if (
        (await fs.pathExists(sourceRunShPath)) &&
        sourceRunShPath !== runShPath
      ) {
        // Copy run.sh to .hxckr/run.sh if it exists and is not already there
        await fs.copy(sourceRunShPath, runShPath);
      }
    }
    // Check if your_program.sh exists
    const yourProgramPath = path.join(cloneDir, "your_program.sh");
    if (!(await fs.pathExists(yourProgramPath))) {
      console.log("your_program.sh not found in the cloned repository");
    } else {
      // Make sure your_program.sh is executable
      await execAsync(`chmod +x ${yourProgramPath}`);
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
