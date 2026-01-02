import { User } from "@/controllers/user/user.controllers";
import { asyncHandler } from "@/utils/asyncHandler";
import express from "express";

const router = express.Router();

router.get("/getuserdata", asyncHandler(User.getUserData));
router.get("/getusers", asyncHandler(User.getUsers));

export default router;
