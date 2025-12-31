import { Request, Response } from "express";
import { prisma } from "@/services/prisma.service";
import z from "zod";
import { BadRequestError, ConflictError, ForbiddenError, InternalServerError } from "@/utils/errors/HttpErrors";
import { addMemberSchema, changeProjectMemberOwnerShipSchema, removeMemberSchema, updateMemberRoleSchema } from "@/utils/schemas/members.schema";

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

        if (isWorkspaceMember.role === "OWNER") {
            throw new ForbiddenError("The workspace owner cannot be added as a member.")
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
                userId: addMemberBody.member_id,
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

    public static changeProjectMemberOwnerShip = async (
        req: Request,
        res: Response
    ) => {
        const userId = req.user?.id;
        const workspaceId = req.workspaceid;

        if (!userId || !workspaceId) {
            throw new BadRequestError("Invalid request");
        }

        const body = z.parse(changeProjectMemberOwnerShipSchema, req.body);

        const { member_id, project_id } = body;

        await prisma.$transaction(async (tx) => {
            const targetMembership = await tx.membership.findUnique({
                where: {
                    userId_workspaceId: {
                        userId: member_id,
                        workspaceId
                    }
                }
            });

            if (!targetMembership) {
                throw new BadRequestError("User is not a workspace member");
            }

            if (targetMembership.role !== "ADMIN") {
                throw new ForbiddenError("Only workspace admins can become project owners");
            }

            const project = await tx.projects.findUnique({
                where: { id: project_id }
            });

            if (!project || project.workspaceId !== workspaceId) {
                throw new BadRequestError("Project not found in this workspace");
            }

            await tx.projectMembers.update({
                where: {
                    projectId_userId: {
                        projectId: project_id,
                        userId: userId
                    }
                },
                data: {
                    role: "MEMBER"
                }
            });

            const existingTargetMember = await tx.projectMembers.findUnique({
                where: {
                    projectId_userId: {
                        projectId: project_id,
                        userId: member_id
                    }
                }
            });

            if (existingTargetMember) {
                await tx.projectMembers.update({
                    where: {
                        projectId_userId: {
                            projectId: project_id,
                            userId: member_id
                        }
                    },
                    data: {
                        role: "OWNER"
                    }
                });
            } else {
                await tx.projectMembers.create({
                    data: {
                        projectId: project_id,
                        userId: member_id,
                        role: "OWNER"
                    }
                });
            }
        });

        return res.status(200).json({
            success: true,
            message: "Project ownership transferred successfully"
        });
    };

    public static changeRole = async (req: Request, res: Response) => {
        const userId = req.user?.id;
        const workspaceId = req.workspaceid;

        if (!userId || !workspaceId) {
            throw new BadRequestError("Invalid request");
        }

        const updateMemberRoleBody = z.parse(updateMemberRoleSchema, req.body)

        await prisma.$transaction(async (tx) => {
            const targetMembership = await tx.membership.findUnique({
                where: {
                    userId_workspaceId: {
                        userId: updateMemberRoleBody.member_id,
                        workspaceId
                    }
                }
            });

            if (!targetMembership) {
                throw new BadRequestError("User is not a workspace member");
            }

            const targetProjectMember = await prisma.projectMembers.findUnique({
                where: {
                    projectId_userId: {
                        projectId: updateMemberRoleBody.project_id,
                        userId: updateMemberRoleBody.member_id
                    }
                }
            });

            if (!targetProjectMember) {
                throw new BadRequestError("User is not a project member")
            }

            if (updateMemberRoleBody.role === "MAINTAINER") {
                if (targetProjectMember.role === "MAINTAINER") {
                    throw new ConflictError("Target user is already a maintainer")
                }
                await prisma.projectMembers.update({
                    where: {
                        projectId_userId: {
                            projectId: updateMemberRoleBody.project_id,
                            userId: updateMemberRoleBody.member_id
                        }
                    },
                    data: {
                        role: "MAINTAINER"
                    }
                })
            } else {
                if (targetProjectMember.role === "MEMBER") {
                    throw new ConflictError("Target user is already a Member")
                }
                await prisma.projectMembers.update({
                    where: {
                        projectId_userId: {
                            projectId: updateMemberRoleBody.project_id,
                            userId: updateMemberRoleBody.member_id
                        }
                    },
                    data: {
                        role: "MEMBER"
                    }
                })
            }
        });

        return res.status(201).json({
            success: true,
            message: "Project membership updated sucessfully"
        })
    }

    public static removeMember = async (req: Request, res: Response) => {
        const userId = req.user?.id;
        const workspaceId = req.workspaceid;

        if (!userId || !workspaceId) {
            throw new BadRequestError("Invalid request");
        }

        const removeMemberBody = z.parse(removeMemberSchema, req.body);

        const targetMembership = await prisma.membership.findUnique({
            where: {
                userId_workspaceId: {
                    userId: removeMemberBody.member_id,
                    workspaceId
                }
            }
        });

        if (!targetMembership) {
            throw new BadRequestError("User is not a workspace member");
        }

        const targetProjectMember = await prisma.projectMembers.findUnique({
            where: {
                projectId_userId: {
                    projectId: removeMemberBody.project_id,
                    userId: removeMemberBody.member_id
                }
            }
        });

        if (!targetProjectMember) {
            throw new BadRequestError("User is not a project member")
        }

        const isDelete = await prisma.projectMembers.delete({
            where: {
                projectId_userId: {
                    projectId: removeMemberBody.project_id,
                    userId: removeMemberBody.member_id 
                }
            }
        });

        if(!isDelete) {
            throw new InternalServerError()
        }

        return res.status(201).json({
            success: true,
            message: "Project membership deleted"
        })
    }
}

