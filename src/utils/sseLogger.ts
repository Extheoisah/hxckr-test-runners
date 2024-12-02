import { SSEManager } from "./sseManager";

class SSELogger {
  static log(commitSha: string, message: string): void {
    SSEManager.getInstance().sendMessage(commitSha, message);
  }
}

export default SSELogger;
