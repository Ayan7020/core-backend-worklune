import z from "zod";

export const InvitationSchemaBody = z.object({
  sendTo: z.email(),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const UpdateInvitationSchema = z.object({
  id: z.string(),
  action: z.enum(["DECLINED", "ACCEPTED"]),
});

export type InvitationDTO = z.infer<typeof InvitationSchemaBody>;
