import { BadRequestError, ForbiddenError } from "@/utils/errors/HttpErrors";
import { prisma } from "@/services/prisma.service";
import { NextFunction, Request, Response } from "express";
import { WORKSPACE_ROLE_ORDER } from "@/utils/Constants/guard";
import { PLANS } from "@/utils/Constants/Plan";

export class WorkspaceRBAC {
  
  static requireMinRole(minRole: keyof typeof WORKSPACE_ROLE_ORDER) {
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

      (req as any).membership = membership;

      next();
    };
  }
}
