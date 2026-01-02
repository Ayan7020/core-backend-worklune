import { Request, Response } from "express";
import { prisma } from "@/services/prisma.service";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
} from "@/utils/errors/HttpErrors";
import {
  addMemberSchema,
  changeProjectMemberOwnerShipSchema,
  removeMemberSchema,
  updateMemberRoleSchema,
} from "@/utils/schemas/members.schema";

export class ProjectMembers {
  public static addProjectMemeber = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const addMemberBody = addMemberSchema.parse(req.body);
    const workspaceId = req.workspaceId;

    if (!userId || !workspaceId) {
      throw new BadRequestError("Invalid request!");
    }

    const isWorkspaceMember = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: addMemberBody.member_id,
          workspaceId,
        },
      },
    });

    if (!isWorkspaceMember) {
      throw new BadRequestError("Member doesn't exists in your workspace");
    }

    if (isWorkspaceMember.role === "OWNER") {
      throw new ForbiddenError("The workspace owner cannot be added as a member.");
    }

    const projects = await prisma.projects.findUnique({
      where: {
        id: addMemberBody.project_id,
      },
      include: {
        projectMembers: {
          where: {
            userId: addMemberBody.member_id,
          },
        },
      },
    });

    if (!projects || projects.workspaceId !== workspaceId) {
      throw new BadRequestError("Project not found");
    }

    if (projects.projectMembers.length > 0) {
      throw new BadRequestError("User is already a member of this project");
    }

    const ok = await prisma.projectMembers.create({
      data: {
        projectId: addMemberBody.project_id,
        userId: addMemberBody.member_id,
        role: addMemberBody.role,
      },
    });

    if (!ok || !ok?.id) {
      throw new BadRequestError("failed to create the member of project");
    }

    return res.status(200).json({
      success: true,
      message: "Project member added successfully",
    });
  };

  public static changeProjectMemberOwnerShip = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const workspaceId = req.workspaceId;

    if (!userId || !workspaceId) {
      throw new BadRequestError("Invalid request");
    }

    const body = changeProjectMemberOwnerShipSchema.parse(req.body);
    const { member_id } = body;
    const projectId = req.projectId ?? body.project_id;

    if (!projectId) {
      throw new BadRequestError("Project context missing");
    }

    await prisma.$transaction(async (tx) => {
      const targetMembership = await tx.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId: member_id,
            workspaceId,
          },
        },
      });

      if (!targetMembership) {
        throw new BadRequestError("User is not a workspace member");
      }

      if (targetMembership.role !== "ADMIN") {
        throw new ForbiddenError("Only workspace admins can become project owners");
      }

      const project = await tx.projects.findUnique({
        where: { id: projectId },
      });

      if (!project || project.workspaceId !== workspaceId) {
        throw new BadRequestError("Project not found in this workspace");
      }

      await tx.projectMembers.update({
        where: {
          projectId_userId: {
            projectId,
            userId: userId,
          },
        },
        data: {
          role: "MEMBER",
        },
      });

      const existingTargetMember = await tx.projectMembers.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: member_id,
          },
        },
      });

      if (existingTargetMember) {
        await tx.projectMembers.update({
          where: {
            projectId_userId: {
              projectId,
              userId: member_id,
            },
          },
          data: {
            role: "OWNER",
          },
        });
      } else {
        await tx.projectMembers.create({
          data: {
            projectId,
            userId: member_id,
            role: "OWNER",
          },
        });
      }
    });

    return res.status(200).json({
      success: true,
      message: "Project ownership transferred successfully",
    });
  };

  public static changeRole = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const workspaceId = req.workspaceId;

    if (!userId || !workspaceId) {
      throw new BadRequestError("Invalid request");
    }

    const updateMemberRoleBody = updateMemberRoleSchema.parse(req.body);
    const projectId = req.projectId ?? updateMemberRoleBody.project_id;

    if (!projectId) {
      throw new BadRequestError("Project context missing");
    }

    await prisma.$transaction(async (tx) => {
      const targetMembership = await tx.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId: updateMemberRoleBody.member_id,
            workspaceId,
          },
        },
      });

      if (!targetMembership) {
        throw new BadRequestError("User is not a workspace member");
      }

      const targetProjectMember = await prisma.projectMembers.findUnique({
        where: {
          projectId_userId: {
            projectId: updateMemberRoleBody.project_id,
            userId: updateMemberRoleBody.member_id,
          },
        },
      });

      if (!targetProjectMember) {
        throw new BadRequestError("User is not a project member");
      }

      if (updateMemberRoleBody.role === "MAINTAINER") {
        if (targetProjectMember.role === "MAINTAINER") {
          throw new ConflictError("Target user is already a maintainer");
        }
        await tx.projectMembers.update({
          where: {
            projectId_userId: {
              projectId,
              userId: updateMemberRoleBody.member_id,
            },
          },
          data: {
            role: "MAINTAINER",
          },
        });
      } else {
        if (targetProjectMember.role === "MEMBER") {
          throw new ConflictError("Target user is already a Member");
        }
        await tx.projectMembers.update({
          where: {
            projectId_userId: {
              projectId,
              userId: updateMemberRoleBody.member_id,
            },
          },
          data: {
            role: "MEMBER",
          },
        });
      }
    });

    return res.status(201).json({
      success: true,
      message: "Project membership updated sucessfully",
    });
  };

  public static removeMember = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const workspaceId = req.workspaceId;

    if (!userId || !workspaceId) {
      throw new BadRequestError("Invalid request");
    }

    const removeMemberBody = removeMemberSchema.parse(req.body);
    const projectId = req.projectId ?? removeMemberBody.project_id;

    if (!projectId) {
      throw new BadRequestError("Project context missing");
    }

    const targetMembership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: removeMemberBody.member_id,
          workspaceId,
        },
      },
    });

    if (!targetMembership) {
      throw new BadRequestError("User is not a workspace member");
    }

    const targetProjectMember = await prisma.projectMembers.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: removeMemberBody.member_id,
        },
      },
    });

    if (!targetProjectMember) {
      throw new BadRequestError("User is not a project member");
    }

    const isDelete = await prisma.projectMembers.delete({
      where: {
        projectId_userId: {
          projectId,
          userId: removeMemberBody.member_id,
        },
      },
    });

    if (!isDelete) {
      throw new InternalServerError();
    }

    return res.status(201).json({
      success: true,
      message: "Project membership deleted",
    });
  };
}
