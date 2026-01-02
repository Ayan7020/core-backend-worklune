import { addTime } from "@/utils/clock";
import { BadRequestError } from "@/utils/errors/HttpErrors";
import { createWorkSpaceSchema } from "@/utils/schemas/workspace.schema";
import { Request, Response } from "express";
import slugify from "slugify";
import { prisma } from "@/services/prisma.service";
import z from "zod";

export class WorkSpace {
  public static createWorkSpace = async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestError("User Id not found!");
    }
    const { workspaceName } = z.parse(createWorkSpaceSchema, req.body);

    await prisma.$transaction(async (tx) => {
      const createdWorkspace = await tx.workspace.create({
        data: {
          name: workspaceName,
          slug: slugify(workspaceName, { replacement: "_" }),
          createdById: userId,
          subscription: {
            create: {
              currentPeriodStart: addTime({}),
            },
          },
          memberships: {
            create: {
              role: "OWNER",
              userId,
            },
          },
        },
      });

      const userSetting = await tx.userSetting.findUnique({
        where: { userId },
      });

      if (!userSetting) {
        await tx.userSetting.create({
          data: {
            userId,
            defaultWorkspaceId: createdWorkspace.id,
          },
        });
      }
    });

    return res.status(201).json({
      success: true,
      message: "Workspace created successfully",
    });
  };
}
