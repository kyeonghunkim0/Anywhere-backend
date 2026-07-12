import { Router } from "express";
import {
  getUserRankingController,
  getPlaceRankingController,
} from "../controllers/ranking.controller.js";

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

export default router;
