import { WorkSpace } from "@/controllers/workspace/workspace.controller";
import { asyncHandler } from "@/utils/asyncHandler";
import express from "express";

const router = express.Router();    
 
router.post("/create-workspace",asyncHandler(WorkSpace.createWorkSpace)) 

export default router;