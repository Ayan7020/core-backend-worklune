import { BadRequestError, ForbiddenError } from "@/utils/errors/HttpErrors";
import { NextFunction, Request, Response } from "express";
import { prisma } from "@/services/prisma.service";
import { PLANS } from "@/utils/Constants/Plan";
import { WorkspacePlan } from "@prisma/client";


interface ValidatePlanInput {
  workspaceId: string;
  action: "ADD_MEMBER" | "CREATE_PROJECT" | "AI_REQUEST";
}

export const validatePlan = async ({
  workspaceId,
  action,
}: ValidatePlanInput): Promise<void> => {

  const subscription = await prisma.subscription.findUnique({
    where: { worspace_id: workspaceId },
  });

  if (!subscription) {
    throw new ForbiddenError("Workspace not found");
  }

  const limits = PLANS[subscription.plan as WorkspacePlan];  

  switch (action) {
    case "ADD_MEMBER": {
      const memberCount = await prisma.membership.count({
        where: { workspaceId },
      });

      if (memberCount >= limits.maxUsers) {
        throw new ForbiddenError(
          `Plan limit reached: max ${limits.maxUsers} members allowed`
        );
      }
      break;
    }

    case "CREATE_PROJECT": {
      const projectCount = await prisma.projects.count({
        where: { workspaceId },
      });

      if (projectCount >= limits.maxProjects) {
        throw new ForbiddenError(
          `Plan limit reached: max ${limits.maxProjects} projects allowed`
        );
      }
      break;
    }

    case "AI_REQUEST": { 
      break;
    }

    default:
      throw new ForbiddenError("Unsupported plan action");
  }

}