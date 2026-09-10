import { Router } from "express";
import {
  getRandomMatchController,
  confirmMatchController,
  cancelMatchController,
  getCurrentTripController,
} from "../controllers/match.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * GET /api/match/random
 * 사용자 GPS 기반 랜덤 관광지 매칭 (인구감소지역 70% 가중치)
 */
router.get("/random", authMiddleware, getRandomMatchController);

/**
 * GET /api/match/current
 * 홈 화면 "이동 중" 카드 - 진행 중인 여정 조회
 */
router.get("/current", authMiddleware, getCurrentTripController);

/**
 * POST /api/match/:matchId/confirm
 * "여기로 결정" - 여정 확정
 */
router.post("/:matchId/confirm", authMiddleware, confirmMatchController);

/**
 * POST /api/match/:matchId/cancel
 * "여정 취소하기"
 */
router.post("/:matchId/cancel", authMiddleware, cancelMatchController);

export default router;
