import { Invitation } from "@/controllers/workspace/invitation.controller";
import { RBAC } from "@/lib/middleware/dashboard/rbac.middleware"; 
import { asyncHandler } from "@/utils/asyncHandler";
import express from "express";

const router = express.Router();    
 
router.post("/create-invitation",RBAC.workspaceRequireMinRole("OWNER"),asyncHandler(Invitation.sendInvitation));
router.post("/update-invitation",asyncHandler(Invitation.updateInvitation));


export default router;