import { RabbitMqService } from "@/services/queues.service";

export const OtpQueueService = new RabbitMqService("otp-queue");
