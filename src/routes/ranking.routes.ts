import { Router } from "express";
import {
  getUserRankingController,
  getPlaceRankingController,
  getMyRankingController,
} from "../controllers/ranking.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * GET /api/ranking/users
 * 도장 개수 기준 유저 TOP 10
 */
router.get("/users", getUserRankingController);

/**
 * GET /api/ranking/places
 * 최근 1주일 인기 지역 TOP 10
 */
router.get("/places", getPlaceRankingController);

/**
 * GET /api/ranking/me
 * 내 랭킹 조회 (인증 필요)
 */
router.get("/me", authMiddleware, getMyRankingController);

export default router;
