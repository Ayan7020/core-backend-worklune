import { Projects } from "@/controllers/workspace/projects/projects.controller";
import { RBAC } from "@/lib/middleware/dashboard/rbac.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import express from "express";

const router = express.Router();    
 
router.post("/create-project",RBAC.workspaceRequireMinRole("ADMIN"),asyncHandler(Projects.createProjects));
router.get("/get-project",RBAC.workspaceRequireMinRole("MEMBER"),asyncHandler(Projects.getProjects));


export default router;