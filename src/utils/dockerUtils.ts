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
  const containerName = `container-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  try {
    const { stdout, stderr } = await execAsync(
      `docker run --name ${containerName} --rm ${imageName} ${command}`,
    );
    return stdout + stderr;
  } catch (error: any) {
    console.error("Docker run error:", error);
    return `Error running Docker command: ${error.message}\n${error.stdout}\n${error.stderr}`;
  } finally {
    // Ensure the container is removed even if there's an error
    await removeContainer(containerName).catch(console.error);
  }
}

export async function removeContainer(containerName: string): Promise<void> {
  try {
    await execAsync(`docker rm -f ${containerName}`);
    console.log(`Container ${containerName} removed successfully`);
  } catch (error: any) {
    console.error(`Error removing container ${containerName}:`, error.message);
  }
}

export async function removeImage(imageName: string): Promise<void> {
  try {
    await execAsync(`docker rmi ${imageName}`);
    console.log(`Image ${imageName} removed successfully`);
  } catch (error: any) {
    console.error(`Error removing image ${imageName}:`, error.message);
  }
}

export async function cleanupDocker(imageName: string): Promise<void> {
  await removeImage(imageName);
}
