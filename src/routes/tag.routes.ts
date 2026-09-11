import { Router } from "express";
import {
  getTagsController,
  getPlacesByTagController,
  attachPlaceTagController,
  detachPlaceTagController,
} from "../controllers/tag.controller.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";

const router = Router();

/**
 * GET /api/tags
 * 홈 화면 큐레이션 해시태그 칩 목록
 */
router.get("/", getTagsController);

/**
 * GET /api/tags/:tagId/places
 * 특정 해시태그가 달린 관광지 목록
 */
router.get("/:tagId/places", getPlacesByTagController);

/**
 * POST /api/tags/:tagId/places (관리자)
 * 관광지를 태그에 연결 (큐레이션)
 */
router.post("/:tagId/places", adminMiddleware, attachPlaceTagController);

/**
 * DELETE /api/tags/:tagId/places/:placeId (관리자)
 * 태그-관광지 연결 해제
 */
router.delete("/:tagId/places/:placeId", adminMiddleware, detachPlaceTagController);

export default router;
