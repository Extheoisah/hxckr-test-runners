import { exec } from "child_process";
import util from "util";

const execAsync = util.promisify(exec);

export async function buildDockerImage(
  repoDir: string,
  imageName: string,
  dockerfilePath: string,
): Promise<void> {
  try {
    const { stdout, stderr } = await execAsync(
      `docker build -t ${imageName} -f ${dockerfilePath} ${repoDir}`,
    );
    console.log("Docker build output:", stdout + stderr);
  } catch (error: any) {
    console.error("Docker build error:", error);
    throw new Error(`Error building Docker image: ${error.message}`);
  }
}

export async function runInDocker(
  imageName: string,
  command: string,
): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(
      `docker run --rm ${imageName} ${command}`,
    );
    return stdout + stderr;
  } catch (error: any) {
    console.error("Docker run error:", error);
    return `Error running Docker command: ${error.message}\n${error.stdout}\n${error.stderr}`;
  }
}
