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
 *               - email
 *               - password
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string 
 *     responses:
 *       201:
 *         description: Authenticated!!
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/signup",asyncHandler(AuthService.Signup))

/**
 * @openapi
 * /auth/verify-otp:
 *   post:
 *     summary: Login in WorkLune 
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
 *               - email
 *               - password
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string 
 *     responses:
 *       201:
 *         description: Authenticated!!
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/verify-otp",asyncHandler(AuthService.verifyOtpHandler));

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login in WorkLune 
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
 *               - email
 *               - password
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string 
 *     responses:
 *       201:
 *         description: Authenticated!!
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post("/login",asyncHandler(AuthService.Login));

router.get("/refresh-token",asyncHandler(AuthService.refreshToken))

export default router;