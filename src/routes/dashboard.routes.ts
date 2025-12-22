import WorkSpaceRouter from "./workspace/workspace.route"; 
import express from "express";

const router = express.Router();    
 
router.use("/workspace",WorkSpaceRouter) 

export default router;