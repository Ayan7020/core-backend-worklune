import { Task } from "@/controllers/workspace/task.controller";
import { RBAC } from "@/lib/middleware/dashboard/rbac.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import express from "express";

const router = express.Router();

router.post(
  "/create-task",
  RBAC.workspaceRequireMinRole("MEMBER"),
  RBAC.projectRequiresMinRole("MAINTAINER", true),
  asyncHandler(Task.createTask),
);
router.get(
  "/get-task",
  RBAC.workspaceRequireMinRole("MEMBER"), 
  asyncHandler(Task.getTask),
);
router.get(
  "/get-taskDetails",
  RBAC.workspaceRequireMinRole("MEMBER"),
  RBAC.projectRequiresMinRole("MEMBER",true),
  asyncHandler(Task.getTaskDetails)
)

export default router;
