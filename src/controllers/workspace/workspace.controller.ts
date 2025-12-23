import { BadRequestError } from "@/utils/errors/HttpErrors";
import { createWorkSpaceSchema } from "@/utils/schemas/workspace.schema";
import { Request, Response } from "express";
import slugify from "slugify";
import z from "zod";

export class WorkSpace {
    public static createWorkSpace = async (req: Request, res: Response) => {
        const userId = req.user?.id; 
        if (!userId) {
            throw new BadRequestError("User Id not found!")
        } 
        const { name: workspaceName } = z.parse(createWorkSpaceSchema, req.body);
        const now = new Date();
        const createdWorkspace = await prisma?.workspace.create({
            data: {
                name: workspaceName,
                slug: slugify(workspaceName,{
                    replacement: "_"
                }),
                createdById: userId,
                subscription: {
                    create: {
                        currentPeriodStart: now
                    }
                },
                memberships: {
                    create: {
                        role: "ADMIN",
                        userId: userId
                    }
                }
            }
        });

        if (!createdWorkspace || !createdWorkspace?.id) {
            throw new BadRequestError("failed to create the workspace");
        }

        return res.status(201).json({
            success: true,
            message: "Workspace created successfully",  
            data: {
                workspace_id: createdWorkspace.id
            }
        })
    }
} 