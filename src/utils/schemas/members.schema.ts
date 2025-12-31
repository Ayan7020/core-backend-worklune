import z  from "zod";

export const addMemberSchema = z.object({
    member_id: z.uuid(),  
    project_id: z.uuid(),
    role: z.enum(['MAINTAINER','MEMBER'])
})

export const changeProjectMemberOwnerShipSchema = z.object({
    member_id: z.uuid(),
    project_id: z.uuid(), 
})

export const updateMemberRoleSchema = z.object({
    member_id: z.uuid(),
    project_id: z.uuid(),
    role: z.enum(['MAINTAINER', 'MEMBER'])
});

export const removeMemberSchema = z.object({
    member_id: z.uuid(),
    project_id: z.uuid()
});