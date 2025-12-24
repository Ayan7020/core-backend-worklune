
import { Membership } from "@prisma/client";
import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface User {
    id: string;
  }

  interface Request {
    user?: User;
    membership?: Membership;
    cookies: {
      access_token?: string;
      refresh_token?: string;
      [key: string]: string | undefined;
    };
  }
}
