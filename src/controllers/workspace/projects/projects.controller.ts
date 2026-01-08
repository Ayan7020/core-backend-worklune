import { createProjectsSchema } from "@/utils/schemas/projects.schema";
import { Request, Response } from "express";
import { prisma } from "@/services/prisma.service";
import { BadRequestError } from "@/utils/errors/HttpErrors";
import { validatePlan } from "@/utils/validatePlan";

export class Projects {
  public static createProjects = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const createProjectsBody = createProjectsSchema.parse(req.body);
    const workspaceId = req.workspaceId;

    if (!userId || !workspaceId) {
      throw new BadRequestError("Invalid request!");
    }

    await validatePlan({
      workspaceId,
      action: "CREATE_PROJECT",
    });

    const ok = await prisma.projects.create({
      data: {
        name: createProjectsBody.name,
        description: createProjectsBody.description,
        color: createProjectsBody.projectColor,
        workspaceId: workspaceId,
        createdById: userId,
        projectMembers: {
          create: {
            role: "OWNER",
            userId: userId,
          },
        },
      },
    });

    if (!ok || !ok.id) {
      throw new BadRequestError("failed to create the project");
    }

    return res.status(200).json({
      success: true,
      message: "project created successfully",
      data: {
        project_id: ok.id,
      },
    });
  };

  public static getProjectsMetaData = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const workspaceId = req.workspaceId;
    if (!userId || !workspaceId) {
      throw new BadRequestError();
    }

    const projectsData = await prisma.projects.findMany({
      where: {
        workspaceId: workspaceId,
      },
      include: {
        _count: {
          select: {
            projectMembers: true,
            tasks: true,
          },
        },
        projectMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    const projectsDataRefine = projectsData.map((pdata) => ({
      id: pdata.id,
      name: pdata.name,
      description: pdata.description,
      color: pdata.color,
      status: pdata.status,
      createdBy: pdata.createdBy.name,
      createdAt: pdata.createdAt,
      projectMembers: pdata.projectMembers.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        avatarUrl: member.user.avatarUrl,
        email: member.user.email,
        role: member.role,
      })),
      projectMemberCount: Number(pdata._count.projectMembers),
      taskCount: Number(pdata._count.tasks),
      completedTaskCount: 0,
    }));

    return res.status(200).json({
      success: true,
      message: "projects found",
      data: {
        projectsDataRefine: projectsDataRefine,
      },
    });
  };

  public static getProjectDetailsByID = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const membership = req.membership;
    const workspaceId = req.workspaceId;
    const projectId = req.query.projectId as string;

    if (!userId || !membership || !workspaceId || !projectId) {
      throw new BadRequestError("Invalid request");
    }

    const projectsDetails = await prisma.projects.findUnique({
      where: {
        id: projectId,
      },
      include: {
        _count: {
          select: {
            projectMembers: true,
            tasks: true,
          },
        },
        projectMembers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
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
        createdBy: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!projectsDetails) {
      throw new BadRequestError("Invalid project id!");
    }

    return res.status(200).json({
      success: true,
      message: "Projects Data",
      data: {
        projectsDetails: {
          id: projectsDetails.id,
          name: projectsDetails.name,
          description: projectsDetails.description,
          color: projectsDetails.color,
          status: projectsDetails.status,
          createdBy: projectsDetails.createdBy.name,
          createdAt: projectsDetails.createdAt,
          projectMembers: projectsDetails.projectMembers.map((member) => ({
            id: member.user.id,
            name: member.user.name,
            avatarUrl: member.user.avatarUrl,
            email: member.user.email,
            role: member.role,
          })),
          projectMemberCount: Number(projectsDetails._count.projectMembers),
          taskCount: Number(projectsDetails._count.tasks),
          completedTaskCount: 0,
          taskData: projectsDetails.tasks,
        },
      },
    });
  };
}
