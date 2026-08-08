import { Router } from "express";
import { loginController } from "../controllers/auth.controller.js";

const router = Router();

/**
 * POST /api/auth/login
 * 소셜 로그인 (Apple / Google)
 */
router.post("/login", loginController);

export default router;
