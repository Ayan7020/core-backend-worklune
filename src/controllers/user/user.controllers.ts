import { BadRequestError } from "@/utils/errors/HttpErrors";
import { Request, Response } from "express";
import { prisma } from "@/services/prisma.service";

export class User {
    public static async getUserData(req: Request, res: Response) {
        const userId = req.user?.id;
        if (!userId) {
            throw new BadRequestError("Invalid Request!")
        };

        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                name: true,
                email: true,
                avatarUrl: true,
                emailVerified: true,
                userSetting: {
                    select: {
                        defaultWorkspaceId: true
                    }
                },
                memberships: {
                    select: {
                        workspaceId: true,
                        role: true,
                        workspace: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        });

        if (!existingUser) {
            throw new BadRequestError("User not found");
        }

        const workspaceData = existingUser.memberships.map(m => ({
            workspaceId: m.workspaceId,
            workspaceName: m.workspace.name,
            role: m.role
        }));

        return res.status(200).json({
            success: true,
            message: "user data found",
            data: {
                userData: {
                    name: existingUser.name,
                    email: existingUser.email,
                    avatarUrl: existingUser.avatarUrl,
                    emailVerified: existingUser.emailVerified,
                    defaultWorkspaceId: existingUser.userSetting?.defaultWorkspaceId
                },
                workspace: workspaceData,
            }
        })
    }
}



