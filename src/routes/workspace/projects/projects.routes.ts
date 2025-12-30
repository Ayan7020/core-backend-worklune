import { Projects } from "@/controllers/workspace/projects/projects.controller";
import { RBAC } from "@/lib/middleware/dashboard/rbac.middleware";
import ProjectsMemberRoutes from "./members.routes"
import { asyncHandler } from "@/utils/asyncHandler";
import express from "express";

const router = express.Router();    
 
router.post("/create-project",RBAC.workspaceRequireMinRole("ADMIN"),asyncHandler(Projects.createProjects));
router.get("/get-project",RBAC.workspaceRequireMinRole("MEMBER"),asyncHandler(Projects.getProjects));

router.use("/members",ProjectsMemberRoutes)

export default router;