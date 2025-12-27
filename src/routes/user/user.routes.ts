import { User } from "@/controllers/user/user.controllers"; 
import { asyncHandler } from "@/utils/asyncHandler";
import express from "express";

const router = express.Router();    
 
router.get("/getuserdata",asyncHandler(User.getUserData)); 


export default router;