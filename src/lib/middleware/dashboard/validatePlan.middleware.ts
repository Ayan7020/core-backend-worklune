import { BadRequestError, ForbiddenError } from "@/utils/errors/HttpErrors";
import { NextFunction, Request, Response } from "express";
import { prisma } from "@/services/prisma.service";
import { PLANS } from "@/utils/Constants/Plan";

export const validatePlan = async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const workspaceId = req.query.workspaceId as string;

    if (!userId || !workspaceId) {
      throw new BadRequestError("Invalid request");
    }

    const existingworkspace = await prisma.workspace.findUnique({
      where: {
        id: workspaceId
      },
      select: {
        subscription: {
          select: { plan: true }
        },
        _count: {
          select: { projects: true, memberships: true }
        }
      }
    });

    if (!existingworkspace) {
      throw new ForbiddenError("workspace not found");
    }

    const plan = existingworkspace.subscription?.plan || "FREE"
    const planLimits = PLANS[plan];

    if (existingworkspace._count.memberships > planLimits.maxUsers) {
      throw new ForbiddenError(
        `Member limit reached for ${plan} plan`
      );
    }
    
    if (existingworkspace._count.projects > planLimits.maxProjects) {
      throw new ForbiddenError(
        `Project limit reached for ${plan} plan`
      );
    }

  }