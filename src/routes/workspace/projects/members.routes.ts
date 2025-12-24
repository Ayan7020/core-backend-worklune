import { ProjectMembers } from "@/controllers/workspace/projects/members.controller"; 
import { RBAC } from "@/lib/middleware/dashboard/rbac.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import express from "express";

const router = express.Router();    
 
router.post("/add-member",RBAC.workspaceRequireMinRole("MEMBER"),RBAC.projectRequiresMinRole("OWNER"),asyncHandler(ProjectMembers.addProjectMemeber));

export default router;