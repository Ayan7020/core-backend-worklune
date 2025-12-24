import { Request, Response } from "express";
import { prisma } from "@/services/prisma.service";
import z from "zod";
import { BadRequestError } from "@/utils/errors/HttpErrors";
import { addMemberSchema } from "@/utils/schemas/members.schema";

export class ProjectMembers {
    public static addProjectMemeber = async (req: Request, res: Response) => {

        const userId = req.user?.id
        const addMemberBody = z.parse(addMemberSchema, req.body);
        const workspaceId = req.query.workspaceId as string;


        if (!userId || !workspaceId) {
            throw new BadRequestError("Invalid request!");
        }

        const isWorkspaceMember = await prisma.membership.findUnique({
            where: {
                userId_workspaceId: {
                    userId: addMemberBody.member_id,
                    workspaceId
                }
            }
        });

        if (!isWorkspaceMember) {
            throw new BadRequestError("Member doesn't exists in your workspace")
        }

        const projects = await prisma.projects.findUnique({
            where: {
                id: addMemberBody.project_id
            },
            include: {
                projectMembers: {
                    where: {
                        userId: addMemberBody.member_id
                    }
                }
            }
        });

        if (!projects || projects.workspaceId !== workspaceId) {
            throw new BadRequestError("Project not found")
        }

        if (projects.projectMembers.length > 0) {
            throw new BadRequestError("User is already a member of this project");
        }

        const ok = await prisma.projectMembers.create({
            data: {
                projectId: addMemberBody.project_id,
                userId: userId,
                role: addMemberBody.role,
            }
        });

        if (!ok || !ok?.id) {
            throw new BadRequestError("failed to create the member of project");
        }

        return res.status(200).json({
            success: true,
            message: "Project member added successfully",
        })
    }

}

