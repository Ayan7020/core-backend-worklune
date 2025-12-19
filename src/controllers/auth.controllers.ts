import { prisma } from "@/services/prisma.service";
import { BadRequestError, InternalServerError } from "@/utils/errors/HttpErrors";
import { getPasswordHash } from "@/utils/Password";
import { SignupSchema } from "@/utils/schemas/login.schema";
import z  from "zod";

export class AuthService {
    public static Login = async (req: Request, res: Response) => { 
            const body = req.body;
            if (!body || typeof body !== "object") {
                throw new BadRequestError("body didnt' found")
            }
            const signupBody = z.parse(SignupSchema, body);
            
            const { salt, hash } = getPasswordHash(signupBody.password);

            const resp = await prisma.user.create({
                data: {
                    name: signupBody.name,
                    email: signupBody.email,
                    passwordHash: hash,
                    salt: salt
                }
            });

            if(!resp.id) {
                throw new InternalServerError();
            }

            
            return res.json()  
    }
}