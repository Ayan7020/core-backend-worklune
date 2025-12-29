import { BadRequestError } from "@/utils/errors/HttpErrors";
import { Request, Response } from "express";
import { prisma } from "@/services/prisma.service";

export class WorkspaceMember {
    public static getWorkSpaceMember = async (req: Request, res: Response) => {
        const userId = req.user?.id;
        const workspaceId = req.workspaceid || req.query.workspaceId as string;
        if (!userId || !workspaceId) {
            throw new BadRequestError()
        }

        // to do tasks fix
        const membershipData = await prisma.membership.findMany({
            where: {
                workspaceId: workspaceId
            },
            include: {
                user: {
                    select: {
                        name: true,
                        avatarUrl: true,
                        email: true,
                        _count: {
                            select: {
                                tasks: true,
                                projects: {
                                    where: {
                                        workspaceId: workspaceId
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!membershipData) {
            throw new BadRequestError("membershipData not found")
        }

        const membersData = membershipData.map(memberData => ({
            name: memberData.user.name,
            email: memberData.user.email,
            role: memberData.role,
            joinedAt: memberData.createdAt,
            taskCount: Number(memberData.user._count.tasks),
            projectCount: Number(memberData.user._count.projects)
        }));

        return res.status(200).json({
            success: true,
            message: "members found",
            data: {
                membersData
            }
        })
    }
}