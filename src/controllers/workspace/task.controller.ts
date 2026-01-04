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
    const isWorkspaceManager = membership.role === "ADMIN" || membership.role === "OWNER";

    const taskSelection = {
      id: true,
      title: true,
      description: true,
      tag: true,
      priority: true,
      status: true,
      assigneeId: true,
      createdById: true,
    } as const;

    const selectProjectShape = {
      id: true,
      name: true,
      color: true,
      projectMembers: {
        where: {
          userId,
        },
        select: {
          role: true,
        },
        take: 1,
      },
    } as const;

    const managerProjects = async () =>
      prisma.projects.findMany({
        where: { workspaceId },
        select: {
          ...selectProjectShape,
          tasks: {
            select: taskSelection,
          },
        },
      });

    const memberProjects = async () =>
      prisma.projects.findMany({
        where: {
          workspaceId,
          projectMembers: {
            some: {
              userId
            }
          }
        },
        select: {
          ...selectProjectShape,
          tasks: {
            select: taskSelection,
          },
        },
      });

    const projects = await (isWorkspaceManager ? managerProjects() : memberProjects());

    const taskData = projects
      .map((project) => ({
        projectId: project.id,
        name: project.name,
        color: project.color,
        userRole: project.projectMembers[0]?.role ?? null,
        tasks: project.tasks,
      }))
    //   .filter((project) => project.tasks.length > 0);

    return res.status(200).json({
      success: true,
      message: "data found",
      data: {
        taksData: taskData,
      },
    });
  }

  public static async getTaskDetails(req: Request, res: Response) {
    const userId = req.user?.id;
    const membership = req.membership;
    const workspaceId = req.workspaceId;
    const taskId = req.query.taskId as string;
    if (!userId || !membership || !workspaceId || !taskId) {
      throw new BadRequestError("Invalid request");
    }

    
  }
}
