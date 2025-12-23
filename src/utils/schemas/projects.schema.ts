import z  from "zod";

export const createProjectsSchema = z.object({
    name: z.string(),  
    description: z.string()
})
 

export type createProjectsDTO = z.infer<typeof createProjectsSchema> 