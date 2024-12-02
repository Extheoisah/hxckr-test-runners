import { Request, Response } from "express";
import { SSEManager } from "../utils/sseManager";
import logger from "../utils/logger";

export const establishSSEConnection = (req: Request, res: Response) => {
  try {
    const commitSha = req.params.commitSha;
    if (!commitSha) {
      res.status(400).json({ error: "Commit SHA is required" });
      return;
    }

    SSEManager.getInstance().addConnection(commitSha, res);
  } catch (error) {
    logger.error("Error establishing SSE connection:", error);
    res.status(500).json({ error: "Failed to establish SSE connection" });
  }
};
