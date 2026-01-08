import z from "zod";

export const createSubTaskSchema = z.object({
  title: z.string().min(4, "Too short title"),
  order: z.number(),
});

export type createSubTaskSchemaDTO = z.infer<typeof createSubTaskSchema>;
