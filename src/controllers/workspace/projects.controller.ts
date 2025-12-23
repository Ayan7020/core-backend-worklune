import { createProjectsSchema } from "@/utils/schemas/projects.schema";
import { Request, Response } from "express";
import { prisma } from "@/services/prisma.service";
import z, { success } from "zod";
import { BadRequestError } from "@/utils/errors/HttpErrors";

export class Projects {
    public static createProjects = async (req: Request, res: Response) => {
        const userId = req.user?.id
        const createProjectsBody = z.parse(createProjectsSchema, req.body);
        const workspaceId = req.query.workspaceId as string;

        if (!userId || !workspaceId) {
            throw new BadRequestError("Invalid request!");
        }

        const ok = await prisma.projects.create({
            data: {
                name: createProjectsBody.name,
                description: createProjectsBody.description,
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

        if (!ok || ok.id) {
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
}

