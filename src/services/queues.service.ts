import { BadRequestError, ServiceUnavaialbleError } from "@/utils/errors/HttpErrors";
import { sleep } from "@/utils/sleep";
import amqp from "amqplib";

export class RabbitMqService {
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;

  private readonly queue: string;
  private readonly reconnectDelay: number;

  private isReconnecting = false;
  private isClosing = false;

  constructor(queue: string) {
    if (!queue) {
      throw new Error("Queue name must be present");
    }
    this.queue = queue.trim();
    this.reconnectDelay = 30_000;
  }

  public async connect(): Promise<amqp.Channel> {
    console.log(`connecting queue: ${this.queue}`);
    await this.createConnection();
    return this.channel!;
  }

  public async close(): Promise<void> {
    this.isClosing = true;
    await this.cleanup();
  }

  public async insertDataToQueue(payload: string) {
    if (!payload || !this.queue) {
      throw new BadRequestError("Payload and queue name are required");
    }

    if (!this.channel || this.isReconnecting) {
      throw new ServiceUnavaialbleError("Queue not connected");
    }

    const ok = this.channel?.sendToQueue(this.queue, Buffer.from(payload), {
      persistent: true,
    });

    if (!ok) {
      throw new ServiceUnavaialbleError("Queue buffer full");
    }
    console.log(`[x] Sent: '${payload}' to queue '${this.queue}'`);
  }

  private async createConnection(): Promise<void> {
    try {
      const connection = await amqp.connect({
        username: process.env.RABBITMQUSER,
        port: Number(process.env.RABBITMQPORT),
        hostname: process.env.RABBITMQHOST,
        password: process.env.RABBITMQPASSWORD,
      });

      connection.on("close", () => {
        if (!this.isClosing) {
          console.error("RabbitMQ connection closed");
          this.Reconnect();
        }
      });

      connection.on("error", (err) => {
        if (!this.isClosing) {
          console.error("RabbitMQ connection error:", err.message);
          this.Reconnect();
        }
      });

      const channel = await connection.createChannel();
      await channel.assertQueue(this.queue, { durable: true });

      this.connection = connection;
      this.channel = channel;

      console.log("RabbitMQ connected and channel created");
    } catch (error: any) {
      throw error;
    }
  }

  private async Reconnect() {
    if (this.isReconnecting) return;
    this.isReconnecting = true;
    console.log("Starting RabbitMQ reconnect loop");
    while (!this.isClosing) {
      try {
        console.log(`Reconnect...Queue!!`);

        await this.cleanup();
        await this.createConnection();

        console.log("RabbitMQ reconnected successfully");
        this.isReconnecting = false;
        return;
      } catch (err: any) {
        console.error(`Reconnect Queue failed :`, err?.message);
        await sleep(this.reconnectDelay);
      }
    }
    this.isReconnecting = false;
    console.error("RabbitMQ unavailable after max retries");
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close().catch(() => {});
        this.channel = undefined;
      }

      if (this.connection) {
        await this.connection.close().catch(() => {});
        this.connection = undefined;
      }
    } catch {}
  }
}
