import WorkSpaceRouter from "./workspace/workspace.route";
import ProjectsRouter from "./workspace/projects.routes"; 
import InvitationRouter from "./workspace/invitation.routes";
import express from "express";

const router = express.Router();    
 
router.use("/workspaces",WorkSpaceRouter) 
router.use("/projects",ProjectsRouter) 
router.use("/invitations",InvitationRouter) 

export default router;