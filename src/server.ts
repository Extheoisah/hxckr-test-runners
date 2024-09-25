import express from "express";
import { runTestProcess } from "./utils/runner";
import { TestRunRequest } from "./models/types";
import {
  setupRabbitMQ,
  getChannel,
  rabbitMQConfig,
  closeRabbitMQ,
} from "./config/rabbitmq";
import logger from "./utils/logger";
import { config } from "./config/config";

const app = express();
app.use(express.json());

const PORT = config.port;

async function startConsumer() {
  const channel = getChannel();
  await channel.consume(rabbitMQConfig.queueTestRunner, async (msg) => {
    if (msg) {
      const testRunRequest: TestRunRequest = JSON.parse(msg.content.toString());
      logger.info("Received test run request from queue", { testRunRequest });

      try {
        await runTestProcess(testRunRequest);
      } catch (error) {
        logger.error("Error processing test run request", {
          error,
          testRunRequest,
        });
      } finally {
        channel.ack(msg);
      }
    }
  });
  logger.info("Test runner consumer started");
}

async function startServer() {
  try {
    await setupRabbitMQ();
    await startConsumer();

    app.listen(PORT, () => {
      logger.info(`Test runner service listening on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

process.on("SIGTERM", async () => {
  logger.info(
    "SIGTERM signal received. Closing HTTP server and RabbitMQ connection",
  );
  await closeRabbitMQ();
  process.exit(0);
});

startServer();
