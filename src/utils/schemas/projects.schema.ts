import z from "zod";

export const PROJECT_COLORS = {
  ORANGE: "#E86C3A",
  BLUE: "#4B8BF5",
  GREEN: "#22C55E",
  PURPLE: "#9333EA",
  YELLOW: "#EAB308",
  PINK: "#EC4899",
  CYAN: "#06B6D4",
  ORANGE_DARK: "#F97316",
} as const;

export const createProjectsSchema = z.object({
  name: z.string(),
  description: z.string(),
  projectColor: z.enum(Object.keys(PROJECT_COLORS) as [keyof typeof PROJECT_COLORS]),
});

export type createProjectsDTO = z.infer<typeof createProjectsSchema>;
