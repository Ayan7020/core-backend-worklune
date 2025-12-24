
import { Request, Response } from "express";
import z from "zod";
import { BadRequestError, ConflictError } from "@/utils/errors/HttpErrors";
import { createTasksSchema } from "@/utils/schemas/task.schema";
import { prisma } from "@/services/prisma.service";

export class Task {
    public static async createTask(req: Request, res: Response) {
        const userId = req.user?.id;
        if (!userId) {
            throw new BadRequestError("Invalid request");
        }

        const createTaskBody = z.parse(createTasksSchema, req.body)

        const userProjectRole = await prisma.projectMembers.findUnique({
            where: {
                projectId_userId: {
                    projectId: createTaskBody.project_id,
                    userId
                }
            },
            select: {
                role: true
            }
        });

        if (!userProjectRole) {
            throw new BadRequestError("User is not a member of this project")
        }

        let assigneeId = userId;
        if (userProjectRole.role !== "MEMBER") {
            assigneeId = createTaskBody.user_assign_id;
        }

        const assigneeProjectMember = await prisma.projectMembers.findUnique({
            where: {
                projectId_userId: {
                    projectId: createTaskBody.project_id,
                    userId: assigneeId
                }
            }
        });

        if (!assigneeProjectMember) {
            throw new BadRequestError("Assignee is not part of this project");
        }


        await prisma.task.create({
            data: {
                assigneeId: assigneeId,
                projectId: createTaskBody.project_id,
                createdById: userId,
                title: createTaskBody.task_title,
                description: createTaskBody.task_description,
                status: "TODO",
                priority: createTaskBody.task_priority,
                tag: createTaskBody.task_tag
            }
        })
    }
}

