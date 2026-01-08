import { SubTask } from "@/controllers/workspace/subtask.controller";
import { RBAC } from "@/lib/middleware/dashboard/rbac.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import express from "express";

const router = express.Router();

router.post(
  "/create-sub-task",
  RBAC.workspaceRequireMinRole("MEMBER"),
  RBAC.projectRequiresMinRole("MEMBER", true),
  asyncHandler(SubTask.createSubTask),
);

export default router;
