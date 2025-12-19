import { sleep } from '@/utils/sleep';
import amqp from 'amqplib';  

export class RabbitMqService {
    private connection?: amqp.ChannelModel;
    private channel?: amqp.Channel;

    private readonly queue: string;
    private readonly maxRetries: number;
    private readonly reconnectDelay: number;

    private isReconnecting = false;
    private isClosing = false;

    constructor(queue: string) {
        if (!queue) {
            throw new Error("Queue name must be present");
        }
        this.queue = queue.trim();
        this.maxRetries = Number(process.env.QUEUE_RETRIES) || 5;
        this.reconnectDelay = 10_000;
    }

    public async connect(): Promise<amqp.Channel> {
        console.log(`connecting queue: ${this.queue}`)
        await this.createConnection();
        return this.channel!;
    }

    public async close(): Promise<void> {
        this.isClosing = true;
        await this.cleanup();
    }

    private async createConnection(): Promise<void> {
        try {
            const connection = await amqp.connect({
                username: process.env.RABBITMQUSER,
                port: Number(process.env.RABBITMQPORT),
                hostname: process.env.RABBITMQHOST,
                password: process.env.RABBITMQPASSWORD
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
            throw error
        }
    }

    private async Reconnect() {
        if (this.isReconnecting) return;
        this.isReconnecting = true;
        console.log("Starting RabbitMQ reconnect loop");
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                console.log(`Reconnect attempt ${attempt}/${this.maxRetries}`);

                await this.cleanup();
                await this.createConnection();

                console.log("RabbitMQ reconnected successfully");
                this.isReconnecting = false;
                return;
            } catch (err: any) {
                console.error(
                    `Reconnect attempt ${attempt} failed:`,
                    err?.message
                );

                if (attempt < this.maxRetries) {
                    await sleep(this.reconnectDelay);
                }
            }
        }
        this.isReconnecting = false;
        console.error("RabbitMQ unavailable after max retries");
        process.exit(1);
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
        } catch {
             
        }
    }
}