import { Router } from "express";
import {
  getMyProfileController,
  getMyProfileStatsController,
  updateMyProfileController,
  updateMySettingsController,
  deleteMyAccountController,
  blockUserController,
  unblockUserController,
  getMyBlockedUsersController,
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
 * GET /api/users/me/stats
 * 프로필 화면 - 수집 도시 / 소멸지역 기여도 / 누적 이동 거리 / 기록 섹션
 */
router.get("/me/stats", authMiddleware, getMyProfileStatsController);

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
 * DELETE /api/users/me
 * 회원 탈퇴
 */
router.delete("/me", authMiddleware, deleteMyAccountController);

/**
 * GET /api/users/me/blocks
 * 내가 차단한 사용자 목록
 */
router.get("/me/blocks", authMiddleware, getMyBlockedUsersController);

/**
 * POST /api/users/:userId/block
 * 사용자 차단
 */
router.post("/:userId/block", authMiddleware, blockUserController);

/**
 * DELETE /api/users/:userId/block
 * 사용자 차단 해제
 */
router.delete("/:userId/block", authMiddleware, unblockUserController);

/**
 * GET /api/users/:userId/detail
 * 랭킹 유저 상세 (활동 그래프 + 대표 도장)
 */
router.get("/:userId/detail", authMiddleware, getRankerDetailController);

export default router;
