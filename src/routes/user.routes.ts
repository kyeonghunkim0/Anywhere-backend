import { Router } from "express";
import {
  getMyProfileController,
  updateMyProfileController,
  updateMySettingsController,
  getRankerDetailController,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * GET /api/users/me
 * 내 프로필 조회
 */
router.get("/me", authMiddleware, getMyProfileController);

/**
 * PATCH /api/users/me
 * 프로필 편집 (닉네임 / 프로필 이미지)
 */
router.patch("/me", authMiddleware, updateMyProfileController);

/**
 * PATCH /api/users/me/settings
 * 설정 - 푸시 알림 on/off
 */
router.patch("/me/settings", authMiddleware, updateMySettingsController);

/**
 * GET /api/users/:userId/detail
 * 랭킹 유저 상세 (활동 그래프 + 대표 도장)
 */
router.get("/:userId/detail", authMiddleware, getRankerDetailController);

export default router;
