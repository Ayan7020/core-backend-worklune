import z  from "zod";

export const addMemberSchema = z.object({
    member_id: z.uuid(),  
    project_id: z.uuid(),
    role: z.enum(['MAINTAINER','MEMBER'])
})
  