import z  from "zod";

export const createWorkSpaceSchema = z.object({
    name: z.string().min(4,"Worspace name is too short.").max(16,"Worspace name is too big.")
})
 

export type createWorkSpaceDTO = z.infer<typeof createWorkSpaceSchema> 