import { WorkSpace } from "@/controllers/workspace/workspace.controller";
import { WorkspaceMember } from "@/controllers/workspace/workspaceMembers.controller";
import { RBAC } from "@/lib/middleware/dashboard/rbac.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import express from "express";

const router = express.Router();

router.post("/create-workspace", asyncHandler(WorkSpace.createWorkSpace));

router.get(
  "/get-workspace-member",
  RBAC.workspaceRequireMinRole("MEMBER"),
  asyncHandler(WorkspaceMember.getWorkSpaceMember),
);

export default router;
