import { TestResult } from "../models/types";
import { getChannel, rabbitMQConfig } from "../config/rabbitmq";
import logger from "./logger";

export async function reportResults(
  commitSha: string,
  result: TestResult,
): Promise<void> {
  try {
    logger.info("Reporting test results:", { result, commitSha });

    const channel = getChannel();
    const message = JSON.stringify({ commitSha, result });

    channel.sendToQueue(rabbitMQConfig.queueTestResults, Buffer.from(message));
    logger.info("Test results reported and pushed to RabbitMQ", { commitSha });
  } catch (error) {
    logger.error("Failed to report test results", { error, commitSha });
  }
}
