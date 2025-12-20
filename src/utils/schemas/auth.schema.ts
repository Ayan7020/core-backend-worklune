import z  from "zod";

export const SignupSchema = z.object({
    name: z.string().min(4,"The name is too small!").max(10,"The name is too big!"),
    email: z.email("Invalid email"),
    password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
    .regex(/^\S*$/, "Password must not contain spaces"),
})

export const LoginSchema = z.object({ 
    email: z.email("Invalid email"),
    password: z
    .string()
    .min(8, "Password must be at least 8 characters") 
})

export type SignupDTO = z.infer<typeof SignupSchema>
export type LoginDTO = z.infer<typeof LoginSchema>