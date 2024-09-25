import { exec } from "child_process";
import util from "util";
import { getNixShellFile } from "../config/config";

const execAsync = util.promisify(exec);

export async function runWithNix(
  language: string,
  repoDir: string,
  commandToRun: string,
): Promise<string> {
  const nixShell = getNixShellFile(language);
  const fullCommand = `nix-shell ${nixShell} --run '${commandToRun}'`;

  try {
    const { stdout, stderr } = await execAsync(fullCommand, { cwd: repoDir });
    return stdout + stderr;
  } catch (error: any) {
    throw new Error(`Error running Nix command: ${error.message}`);
  }
}
