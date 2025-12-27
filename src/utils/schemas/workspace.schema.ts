import z  from "zod";

export const createWorkSpaceSchema = z.object({
    workspaceName: z.string().min(4,"Worspace name is too short.").max(24,"Worspace name is too big.")
})
 

export type createWorkSpaceDTO = z.infer<typeof createWorkSpaceSchema> 