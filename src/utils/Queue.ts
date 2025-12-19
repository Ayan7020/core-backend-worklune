import { RabbitMqService } from "@/services/queues.service";

export const emailQueueService = new RabbitMqService("email-queue");
