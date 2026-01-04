import { prisma } from "@/services/prisma.service";
import { PROJECT_ROLE_ORDER, WORKSPACE_ROLE_ORDER } from "@/utils/Constants/guard";
import { BadRequestError, ConflictError, ForbiddenError } from "@/utils/errors/HttpErrors";
import type { Membership } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

type WorkspaceRole = keyof typeof WORKSPACE_ROLE_ORDER;
type ProjectRole = keyof typeof PROJECT_ROLE_ORDER;

const WORKSPACE_ID_BODY_KEYS = ["workspaceId", "workspace_id", "workspace"];
const PROJECT_ID_BODY_KEYS = ["projectId", "project_id", "project"];

const coerceIdentifier = (value: unknown): string | undefined => { 
  if (Array.isArray(value)) {
    return coerceIdentifier(value[0]);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return undefined;
};

const extractFromBody = (body: unknown, key: string): unknown => {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  return (body as Record<string, unknown>)[key];
};

const maybeExtractEntityId = (entity: unknown): string | undefined => {
  if (!entity || typeof entity !== "object") {
    return undefined;
  }

  return coerceIdentifier((entity as Record<string, unknown>).id);
};

const resolveWorkspaceId = (req: Request): string | undefined => {
  const workspaceEntity = extractFromBody(req.body, "workspace");
  const fromBody = WORKSPACE_ID_BODY_KEYS.map((key) =>
    coerceIdentifier(extractFromBody(req.body, key)),
  ).find(Boolean);

  return (
    req.workspaceId ??
    req.workspaceid ??
    coerceIdentifier(req.params?.workspaceId) ??
    coerceIdentifier(req.query.workspaceId) ??
    fromBody ??
    maybeExtractEntityId(workspaceEntity)
  );
};

const resolveProjectId = (req: Request): string | undefined => { 
  const fromBody = PROJECT_ID_BODY_KEYS.map((key) =>
    coerceIdentifier(extractFromBody(req.body, key)),
  ).find(Boolean); 

  const inquery = req.query.projectId
  return (
    req.projectId ?? 
    coerceIdentifier(req.params?.projectId) ??
    coerceIdentifier(req.query.projectId) ??
    fromBody  
  );
};

const hasRequiredRole = <T extends Record<string, number>>(
  currentRole: keyof T,
  minimumRole: keyof T,
  orderMap: T,
) => orderMap[currentRole] >= orderMap[minimumRole];

const ensureWorkspaceMembership = async (
  userId: string,
  workspaceId: string,
  cachedMembership?: Membership,
) => {
  if (cachedMembership && cachedMembership.workspaceId === workspaceId) {
    return cachedMembership;
  }

  return prisma.membership.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId },
    },
  });
};

const persistWorkspaceContext = (req: Request, workspaceId: string, membership: Membership) => {
  req.membership = membership;
  req.workspaceId = workspaceId;
  req.workspaceid = workspaceId;
};

const persistProjectContext = (req: Request, projectId: string, role: ProjectRole) => {
  req.projectId = projectId;
  req.projectRole = role;
};

export class RBAC {
  static workspaceRequireMinRole(minRole: WorkspaceRole) {
    return async (req: Request, _res: Response, next: NextFunction) => {
      const userId = req.user?.id;
      const workspaceId = resolveWorkspaceId(req);

      if (!userId || !workspaceId) {
        throw new BadRequestError("Workspace context is missing");
      }

      const membership = await ensureWorkspaceMembership(userId, workspaceId, req.membership);

      if (!membership) {
        throw new ForbiddenError("You are not a member of this workspace");
      }

      if (!hasRequiredRole(membership.role as WorkspaceRole, minRole, WORKSPACE_ROLE_ORDER)) {
        throw new ForbiddenError(`Requires ${minRole.toLowerCase()} access`);
      }

      persistWorkspaceContext(req, workspaceId, membership);
      next();
    };
  }

  static projectRequiresMinRole(minRole: ProjectRole, allowWorkspaceOverride: boolean = false) {
    return async (req: Request, _res: Response, next: NextFunction) => {
      const userId = req.user?.id;

      if (!userId) {
        throw new BadRequestError("User context is missing");
      }

      const workspaceId = resolveWorkspaceId(req) ?? req.membership?.workspaceId;

      if (!workspaceId) {
        throw new BadRequestError("Workspace context is required for project access");
      }

      const membership = await ensureWorkspaceMembership(userId, workspaceId, req.membership);

      if (!membership) {
        throw new ForbiddenError("You are not a member of this workspace");
      }
      const projectId = resolveProjectId(req);
      console.log("projectId")

      if (!projectId || typeof projectId === "undefined" || projectId === "undefined") {
        throw new BadRequestError("Project context is missing");
      }

      const workspaceProject = await prisma.projects.findFirst({
        where: {
          workspaceId: membership.workspaceId,
          id: projectId
        }
      });

      if (!workspaceProject) {
        throw new ConflictError("The project is not belongs to the workspace!")
      }
      persistWorkspaceContext(req, workspaceId, membership);

      const bypassProjectChecks =
        membership.role === "OWNER" || (allowWorkspaceOverride && membership.role !== "MEMBER");

      if (bypassProjectChecks) {
        return next();
      }


      const projectMember = await prisma.projectMembers.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
        select: {
          role: true,
        },
      });

      if (!projectMember || !projectMember.role) {
        throw new ForbiddenError("You are not a member of this project");
      }

      const userRole = projectMember.role as ProjectRole;

      if (!hasRequiredRole(userRole, minRole, PROJECT_ROLE_ORDER)) {
        throw new ForbiddenError(`Requires ${minRole.toLowerCase()} access or admin privileges`);
      }

      persistProjectContext(req, projectId, userRole);
      next();
    };
  }
}
