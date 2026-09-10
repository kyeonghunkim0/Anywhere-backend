import { Router } from "express";
import { getPlaceDetailController, listPlacesController } from "../controllers/place.controller.js";

const router = Router();

/**
 * GET /api/places
 * 검색·발견 대상 장소 카탈로그 (공개 조회, 검색어 없을 때의 추천 목록)
 */
router.get("/", listPlacesController);

/**
 * GET /api/places/:placeId
 * 장소 상세 (공개 조회)
 */
router.get("/:placeId", getPlaceDetailController);

export default router;
