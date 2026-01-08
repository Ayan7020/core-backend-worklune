import { Membership } from "@prisma/client";
import "express-serve-static-core";

type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";
type ProjectRole = "OWNER" | "MAINTAINER" | "MEMBER";

declare module "express-serve-static-core" {
  interface User {
    id: string;
  }

  interface Request {
    user?: User;
    membership?: Membership;
    workspaceId?: string;
    workspaceid?: string;
    projectId?: string;
    projectRole?: ProjectRole;
    taskId?: string;
    cookies: {
      access_token?: string;
      refresh_token?: string;
      [key: string]: string | undefined;
    };
  }
}
