import { Response } from "express";
import logger from "./logger";

export class SSEManager {
  private static instance: SSEManager;
  private connections: Map<string, Response>;

  private constructor() {
    this.connections = new Map();
  }

  public static getInstance(): SSEManager {
    if (!SSEManager.instance) {
      SSEManager.instance = new SSEManager();
    }
    return SSEManager.instance;
  }

  public addConnection(commitSha: string, res: Response): void {
    // Check if connection already exists
    if (this.connections.has(commitSha)) {
      logger.warn(`Connection already exists for commit: ${commitSha}`);
      return;
    }

    // Set headers only once
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Store the connection
    this.connections.set(commitSha, res);

    // Send initial message
    this.sendMessage(commitSha, "Connected to test runner...");

    res.on("close", () => {
      this.removeConnection(commitSha);
      logger.info(`SSE connection closed for commit: ${commitSha}`);
    });
  }

  public sendMessage(commitSha: string, message: string): void {
    const connection = this.connections.get(commitSha);
    if (connection) {
      try {
        connection.write(`data: ${JSON.stringify({ message })}\n\n`);
        logger.debug(`Sent message for ${commitSha}: ${message}`);
      } catch (error) {
        logger.error(`Error sending message for ${commitSha}:`, error);
        this.removeConnection(commitSha);
      }
    } else {
      logger.debug(`No connection found for ${commitSha}`);
    }
  }

  public removeConnection(commitSha: string): void {
    this.connections.delete(commitSha);
    logger.debug(`Removed connection for ${commitSha}`);
  }

  public closeConnection(commitSha: string): void {
    const connection = this.connections.get(commitSha);
    if (connection) {
      try {
        this.sendMessage(commitSha, "Test run completed");
        connection.end();
        this.removeConnection(commitSha);
        logger.info(`Closed connection for ${commitSha}`);
      } catch (error) {
        logger.error(`Error closing connection for ${commitSha}:`, error);
        this.removeConnection(commitSha);
      }
    }
  }
}
