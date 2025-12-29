import { BadRequestError, ConflictError, ForbiddenError } from "@/utils/errors/HttpErrors";
import { prisma } from "@/services/prisma.service";
import { NextFunction, Request, Response } from "express";
import { PROJECT_ROLE_ORDER, WORKSPACE_ROLE_ORDER } from "@/utils/Constants/guard";
import { Membership } from "@prisma/client";

export class RBAC {
  static workspaceRequireMinRole(minRole: keyof typeof WORKSPACE_ROLE_ORDER) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.id;
      const workspaceId = req.query.workspaceId as string;

      if (!userId || !workspaceId) {
        throw new BadRequestError("Invalid request");
      }

      const membership = await prisma.membership.findUnique({
        where: {
          userId_workspaceId: { userId, workspaceId }
        }
      });

      if (!membership) {
        throw new ForbiddenError("You are not a member of this workspace");
      }

      const userRoleRank = WORKSPACE_ROLE_ORDER[membership.role];
      const requiredRoleRank = WORKSPACE_ROLE_ORDER[minRole];

      if (userRoleRank < requiredRoleRank) {
        throw new ForbiddenError(
          `Requires ${minRole.toLowerCase()} access`
        );
      }

      req.membership = membership;
      req.workspaceid = workspaceId;

      next();
    };
  }
  static projectRequiresMinRole(minRole: keyof typeof PROJECT_ROLE_ORDER) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.id;
      const userMembership = req.membership;

      if (!userMembership || !userId) {
        throw new BadRequestError("Invalid request!")
      }

      if (userMembership.role == "MEMBER") {
        const userMember = await prisma.projectMembers.findUnique({
          where: {
            projectId_userId: {
              projectId: req.body?.projectId,
              userId
            }
          },
          select: {
            role: true
          }
        });

        if (!userMember || !userMember.role) {
          throw new ForbiddenError("user is not member of a project or not have admin work privelleges")
        }

        const userProjectRoleRank = PROJECT_ROLE_ORDER[userMember.role]
        const requireProjectRoleRank = PROJECT_ROLE_ORDER[minRole]

        if (requireProjectRoleRank > userProjectRoleRank) {
          throw new ForbiddenError(
            `Requires ${minRole.toLowerCase()} access or admin privellegs`
          );
        }
      }

      next();
    };
  }
}
