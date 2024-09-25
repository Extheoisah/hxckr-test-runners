import amqp from "amqplib";
import dotenv from "dotenv";

dotenv.config();

export const rabbitMQConfig = {
  host: process.env.RABBITMQ_HOST,
  port: process.env.RABBITMQ_PORT,
  username: process.env.RABBITMQ_USERNAME,
  password: process.env.RABBITMQ_PASSWORD,
  queueTestRunner: "test_runner_queue",
  queueTestResults: "test_results_queue",
};

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

export async function setupRabbitMQ() {
  try {
    if (
      !rabbitMQConfig.host ||
      !rabbitMQConfig.port ||
      !rabbitMQConfig.username ||
      !rabbitMQConfig.password
    ) {
      throw new Error("RabbitMQ configuration is incomplete");
    }
    const url = `amqp://${rabbitMQConfig.username}:${rabbitMQConfig.password}@${rabbitMQConfig.host}:${rabbitMQConfig.port}`;
    connection = await amqp.connect(url);
    channel = await connection.createChannel();
    await channel.assertQueue(rabbitMQConfig.queueTestRunner, {
      durable: true,
    });
    await channel.assertQueue(rabbitMQConfig.queueTestResults, {
      durable: true,
    });
    console.log("RabbitMQ setup completed");
  } catch (error) {
    console.error("Error setting up RabbitMQ:", error);
    throw error;
  }
}

export function getChannel(): amqp.Channel {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized");
  }
  return channel;
}

export async function closeRabbitMQ() {
  if (channel) await channel.close();
  if (connection) await connection.close();
}
