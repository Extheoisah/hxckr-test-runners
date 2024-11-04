import { exec } from "child_process";
import util from "util";
import logger from "./logger";

const execAsync = util.promisify(exec);

export async function buildDockerImage(
  repoDir: string,
  imageName: string,
  dockerfilePath: string,
): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(
      `docker build -t ${imageName} -f ${dockerfilePath} ${repoDir}`,
    );
    return stdout + stderr;
  } catch (error: any) {
    throw new Error(`Error building Docker image: ${error.message}`);
  }
}

export async function runInDocker(
  imageName: string,
  command: string,
): Promise<string> {
  const containerName = `container-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  try {
    const { stdout, stderr } = await execAsync(
      `docker run --name ${containerName} --rm ${imageName} ${command}`,
    );
    return stdout + stderr;
  } catch (error: any) {
    // For test failures, we want to capture the output rather than treat it as an error
    if (error.stdout || error.stderr) {
      return error.stdout + error.stderr;
    }
    // For actual Docker errors, return an error message
    return `Docker execution error: ${error.message}`;
  } finally {
    // Ensure the container is removed even if there's an error
    await removeContainer(containerName).catch(console.error);
  }
}

export async function removeContainer(containerName: string): Promise<void> {
  try {
    await execAsync(`docker rm -f ${containerName}`);
    logger.info(`Container ${containerName} removed successfully`);
  } catch (error: any) {
    logger.error(`Error removing container ${containerName}:`, error.message);
  }
}

export async function removeImage(imageName: string): Promise<void> {
  try {
    await execAsync(`docker rmi ${imageName}`);
    logger.info(`Image ${imageName} removed successfully`);
  } catch (error: any) {
    logger.error(`Error removing image ${imageName}:`, error.message);
  }
}

export async function cleanupDocker(imageName: string): Promise<void> {
  await removeImage(imageName);
}
