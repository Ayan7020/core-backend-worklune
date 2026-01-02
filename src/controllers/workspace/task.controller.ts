import { Request, Response } from "express";
import { BadRequestError } from "@/utils/errors/HttpErrors";
import { createTasksSchema } from "@/utils/schemas/task.schema";
import { prisma } from "@/services/prisma.service";

export class Task {
  public static async createTask(req: Request, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestError("Invalid request");
    }

    const createTaskBody = createTasksSchema.parse(req.body);
    const projectId = req.projectId ?? createTaskBody.project_id;

    if (!projectId) {
      throw new BadRequestError("Project context missing");
    }

    const userProjectRole = await prisma.projectMembers.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
      select: {
        role: true,
      },
    });

    if (!userProjectRole) {
      throw new BadRequestError("User is not a member of this project");
    }

    let assigneeId = userId;
    if (userProjectRole.role !== "MEMBER") {
      assigneeId = createTaskBody.user_assign_id;
    }

    const assigneeProjectMember = await prisma.projectMembers.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: assigneeId,
        },
      },
    });

    if (!assigneeProjectMember) {
      throw new BadRequestError("Assignee is not part of this project");
    }

    await prisma.task.create({
      data: {
        assigneeId: assigneeId,
        projectId,
        createdById: userId,
        title: createTaskBody.task_title,
        description: createTaskBody.task_description,
        status: "TODO",
        priority: createTaskBody.task_priority,
        tag: createTaskBody.task_tag,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Task created",
    });
  }

  public static async getTask(req: Request, res: Response) {
    const userId = req.user?.id;
    const membership = req.membership;
    const workspaceId = req.workspaceId;
    if (!userId || !membership || !workspaceId) {
      throw new BadRequestError("Invalid request");
    }
    let userTaskData = [];
    // if (membership.role === "ADMIN" || membership.role === "OWNER") {
    userTaskData = await prisma.projects.findMany({
      where: {
        workspaceId: workspaceId,
      },
      include: {
        projectMembers: {
          where: {
            userId: userId,
          },
          select: {
            role: true,
          },
          take: 1,
        },
        tasks: {
          select: {
            id: true,
            title: true,
            description: true,
            tag: true,
            priority: true,
            status: true,
            assigneeId: true,
            createdById: true,
          },
        },
      },
    });
    // }

    userTaskData = userTaskData.map((data) => ({
      projectId: data.id,
      name: data.name,
      userRole: data.projectMembers[0].role,
      task: data.tasks,
    }));

    return res.status(200).json({
      success: true,
      message: "data found",
      data: {
        taksData: userTaskData,
      },
    });
  }
}
