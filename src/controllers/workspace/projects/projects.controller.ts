import { createProjectsSchema } from "@/utils/schemas/projects.schema";
import { Request, Response } from "express";
import { prisma } from "@/services/prisma.service";
import z, { success } from "zod";
import { BadRequestError } from "@/utils/errors/HttpErrors";
import { validatePlan } from "@/utils/validatePlan";

export class Projects {
    public static createProjects = async (req: Request, res: Response) => {

        const userId = req.user?.id
        const createProjectsBody = z.parse(createProjectsSchema, req.body);
        const workspaceId = req.query.workspaceId as string;

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
                        userId: userId
                    }
                }
            }
        });

        if (!ok || !ok.id) {
            throw new BadRequestError("failed to create the project");
        }

        return res.status(200).json({
            success: true,
            message: "project created successfully",
            data: {
                project_id: ok.id
            }
        })
    }

    public static getProjects = async (req: Request, res: Response) => {
        const userId = req.user?.id;
        const workspaceId = req.workspaceid as string;
        if (!userId || !workspaceId) {
            throw new BadRequestError();
        }

        let projectsDataRefine = [];

        const projectsData = await prisma.projects.findMany({
            where: {
                workspaceId: workspaceId
            },
            include: {
                _count: {
                    select: {
                        projectMembers: true,
                        tasks: true
                    }
                },
                projectMembers: {
                    include: {
                        user: {
                            select: {
                                name: true,
                                email: true,
                                avatarUrl: true
                            },

                        }
                    }
                },
                createdBy: {
                    select: {
                        name: true,
                    }
                }
            }
        });

        projectsDataRefine = projectsData.map(pdata => ({
            id: pdata.id,
            name: pdata.name,
            description: pdata.description,
            color: pdata.color,
            status: pdata.status,
            createdBy: pdata.createdBy.name,
            createdAt: pdata.createdAt,
            projectMembers: pdata.projectMembers.map(member => ({
                name: member.user.name,
                avatarUrl: member.user.avatarUrl,
                email: member.user.email,
                role: member.role
            })),
            projectMemberCount: Number(pdata._count.projectMembers),
            taskCount: Number(pdata._count.tasks),
            completedTaskCount: 0
        }));

        return res.status(200).json({
            success: true,
            message: "projects found",
            data: {
                projectsDataRefine: projectsDataRefine
            }
        })
    }

}

