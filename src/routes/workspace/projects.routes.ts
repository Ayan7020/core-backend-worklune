import { Projects } from "@/controllers/workspace/projects.controller";
import { WorkspaceRBAC } from "@/lib/middleware/dashboard/rbac.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import express from "express";

const router = express.Router();    
 
router.post("/create-project",WorkspaceRBAC.requireMinRole("ADMIN"),asyncHandler(Projects.createProjects)) 

export default router;