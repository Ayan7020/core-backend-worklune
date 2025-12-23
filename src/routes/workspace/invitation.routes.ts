import { Invitation } from "@/controllers/workspace/invitation.controller";
import { WorkspaceRBAC } from "@/lib/middleware/dashboard/rbac.middleware";
import { validatePlan } from "@/lib/middleware/dashboard/validatePlan.middleware";
import { asyncHandler } from "@/utils/asyncHandler";
import express from "express";

const router = express.Router();    

//to-do check for the plan 
router.post("/create-invitation",WorkspaceRBAC.requireMinRole("OWNER"),validatePlan,asyncHandler(Invitation.sendInvitation)) 
router.post("/update-invitation",asyncHandler(Invitation.updateInvitation)) 


export default router;