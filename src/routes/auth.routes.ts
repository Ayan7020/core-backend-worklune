import { AuthService } from "@/controllers/auth.controllers";
import { asyncHandler } from "@/utils/asyncHandler";
import express from "express";

const router = express.Router();    

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     summary: Signup in WorkLune 
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *     responses:
 *       201:
 *         description: Authenticated!!
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/signup",asyncHandler(AuthService.Login))

export default router;