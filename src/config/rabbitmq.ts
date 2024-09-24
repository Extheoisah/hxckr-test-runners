import amqp from "amqplib";

export const rabbitMQConfig = {
  url: process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672",
  queueTestRunner: "test_runner_queue",
  queueTestResults: "test_results_queue",
};

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

export async function setupRabbitMQ() {
  try {
    connection = await amqp.connect(rabbitMQConfig.url);
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
