import { BadRequestError, ConflictError, ForbiddenError, UnauthorizedError } from "@/utils/errors/HttpErrors";
import { InvitationSchemaBody, UpdateInvitationSchema } from "@/utils/schemas/invitation.schema";
import e, { Request, Response } from "express";
import z, { success } from "zod";
import { prisma } from "@/services/prisma.service";
import { validatePlan } from "@/utils/validatePlan";

export class Invitation {
    public static async sendInvitation(req: Request, res: Response) {
        const invitationBody = z.parse(InvitationSchemaBody, req.body);
        if (!req.user) {
            throw new UnauthorizedError("Unauthorized");
        }
        const inviterId = req.user!.id;
        const workspaceId  = req.query.workspaceId as string;

        const targetUser = await prisma.user.findUnique({
            where: { email: invitationBody.sendTo }

        });

        if (!targetUser || !workspaceId ) {
            throw new BadRequestError("Unable to send invitation");
        }

        if (inviterId === targetUser.id) {
            console.log(targetUser.id,inviterId)
            throw new ConflictError("Unable to send invitation");
        }

        const existingMembership = await prisma.membership.findFirst({
            where: {
                userId: targetUser.id,
                workspaceId
            }
        });

        if (existingMembership) {
            throw new ConflictError(`${targetUser.email} is already there in your requested workspace.`);
        }

        const existingInvitation = await prisma.invitation.findFirst({
            where: {
                userId: targetUser.id,
                workspaceId,
                status: "PENDING"
            }
        });

        if (existingInvitation) {
            throw new ConflictError("Invitation is already sent");
        }

        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

        await prisma.invitation.create({
            data: {
                userId: targetUser.id,
                workspaceId: workspaceId,
                role: invitationBody.role,
                invitedById: inviterId,
                expiresAt, 
            }
        });

        return res.status(201).json({
            success: true,
            message: "Invitation sent!"
        })
    }

    public static async   updateInvitation(req: Request, res: Response) {
        const updateInvitationBody = z.parse(UpdateInvitationSchema, req.body);

        const invitation = await prisma.invitation.findUnique({
            where: { id: updateInvitationBody.id }
        });

        if (!invitation) {
            throw new BadRequestError("Invitation not found");
        }

        if (invitation.userId !== req.user?.id) {
            throw new ForbiddenError("Not allowed");
        }

        if (invitation.status !== "PENDING") {
            throw new ConflictError("Invitation already handled");
        }

        if (invitation.expiresAt < new Date()) {
            throw new ConflictError("Invitation expired");
        }
        
        await prisma.$transaction(async (tx) => {
            if (updateInvitationBody.action === "ACCEPTED") {
                await validatePlan({
                    workspaceId: invitation.workspaceId,
                    action: "ADD_MEMBER",
                });
            }
            await tx.invitation.update({
                where: {
                    id: updateInvitationBody.id
                },
                data: {
                    status: updateInvitationBody.action,
                    respondedAt: new Date()
                }
            });

            if (updateInvitationBody.action === "ACCEPTED") {
                await tx.membership.create({
                    data: {
                        role: invitation.role,
                        userId: invitation.userId,
                        workspaceId: invitation.workspaceId
                    }
                });
            }
        });


        res.status(201).json({
            success: true,
            message: "updated the invitation"
        })
    }
}