import express from "express";

const router = express.Router();    

/**
 * @openapi
 * /auth:
 *   post:
 *     summary: Auth Check
 *     tags:
 *       - Tasks
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
router.post("/login",(req, res) => {
  res.status(201).json({ message: "Authenticated!!" });
})
 ;

export default router;