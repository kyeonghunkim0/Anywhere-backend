import { Router } from "express";
import {
  loginController,
  guestLoginController,
  upgradeGuestController,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * POST /api/auth/login
 * 소셜 로그인 (Apple / Google)
 */
router.post("/login", loginController);

/**
 * POST /api/auth/guest
 * 비회원(게스트) 로그인 — deviceId 기준, 일정 시간 후 만료
 */
router.post("/guest", guestLoginController);

/**
 * POST /api/auth/guest/upgrade
 * 게스트 계정을 소셜 로그인 정회원 계정으로 전환
 */
router.post("/guest/upgrade", authMiddleware, upgradeGuestController);

export default router;
