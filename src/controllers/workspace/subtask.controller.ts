import { BadRequestError, ForbiddenError } from "@/utils/errors/HttpErrors";
import { createSubTaskSchema } from "@/utils/schemas/subtask.schema";
import { Request, Response } from "express";
import { prisma } from "@/services/prisma.service";

export class SubTask {
  public static async createSubTask(req: Request, res: Response) {
    const userId = req.user?.id;
    const taskId = req.taskId;
    if (!userId || !taskId || !req.projectRole) {
      throw new BadRequestError();
    }

    const subTaskBody = createSubTaskSchema.parse(userId);

    if (req.projectRole === "MEMBER") {
      const isUserTask = await prisma.task.findUnique({
        where: {
          id: taskId,
          assigneeId: userId,
        },
      });

      if (!isUserTask) {
        throw new ForbiddenError("You cannot have access to create the subtask");
      }
    }

    await prisma.subTask.create({
      data: {
        taskId: taskId,
        createdById: userId,
        title: subTaskBody.title,
        order: subTaskBody.order,
      },
    });

    return res.status(201).json({
      success: true,
      message: "sub task created",
    });
  }
}
