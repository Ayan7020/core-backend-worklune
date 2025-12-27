import WorkSpaceRouter from "./workspace/workspace.route";
import ProjectsRouter from "./workspace/projects/projects.routes"; 
import InvitationRouter from "./workspace/invitation.routes";
import UserRouter from "./user/user.routes";

import express from "express";

const router = express.Router();    
 
router.use("/workspaces",WorkSpaceRouter) 
router.use("/projects",ProjectsRouter) 
router.use("/invitations",InvitationRouter) 
router.use("/user",UserRouter)

export default router;