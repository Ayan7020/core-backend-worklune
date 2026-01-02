import z from "zod";

export const createTasksSchema = z.object({
  project_id: z.string(),
  task_title: z.string(),
  task_priority: z.enum(["URGENT", "HIGH", "LOW"]),
  task_description: z.string(),
  task_due_date: z.date(),
  task_tag: z.string(),
  user_assign_id: z.string(),
});
