import { ProjectMembers } from "@/controllers/workspace/projects/members.controller";
import { RBAC } from "@/lib/middleware/dashboard/rbac.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import express from "express";

const router = express.Router();

router.post(
  "/add-member",
  RBAC.workspaceRequireMinRole("ADMIN"),
  asyncHandler(ProjectMembers.addProjectMemeber),
);
router.post(
  "/change-project-ownership",
  RBAC.workspaceRequireMinRole("ADMIN"),
  RBAC.projectRequiresMinRole("OWNER"),
  asyncHandler(ProjectMembers.changeProjectMemberOwnerShip),
);
router.post(
  "/change-role",
  RBAC.workspaceRequireMinRole("ADMIN"),
  RBAC.projectRequiresMinRole("OWNER"),
  asyncHandler(ProjectMembers.changeRole),
);
router.post(
  "/remove-member",
  RBAC.workspaceRequireMinRole("ADMIN"),
  RBAC.projectRequiresMinRole("OWNER"),
  asyncHandler(ProjectMembers.removeMember),
);

export default router;
