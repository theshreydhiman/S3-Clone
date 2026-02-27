import express from "express";
import rateLimit from "express-rate-limit";
import { login, register, logout, logoutAll } from "../controller/auth.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login
 *     description: Authenticate user with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       '200':
 *         description: Successful Logged In!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     _id:
 *                       type: string
 *                     __v:
 *                       type: number
 *                 token:
 *                   type: string
 *       '400':
 *         description: Invalid email or password
 */
router.post("/login", authLimiter, login);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register
 *     description: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       '201':
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     _id:
 *                       type: string
 *                     __v:
 *                       type: number
 *                 token:
 *                   type: string
 *       '400':
 *         description: Internal server error
 */
router.post("/register", authLimiter, register);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout
 *     description: Logout the currently authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: Successfully logged out
 *       '401':
 *         description: Unauthorized request
 *       '500':
 *         description: Internal server error
 */
router.post("/logout", auth, logout);

/**
 * @swagger
 * /auth/logoutall:
 *   post:
 *     summary: Logout All
 *     description: Logout the currently authenticated user from all sessions
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       '200':
 *         description: All sessions logged out
 *       '401':
 *         description: Unauthorized request
 *       '500':
 *         description: Internal server error
 */
router.post("/logoutall", auth, logoutAll);

export default router;