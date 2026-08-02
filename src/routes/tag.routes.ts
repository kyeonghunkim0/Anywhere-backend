import { Router } from "express";
import { getTagsController, getPlacesByTagController } from "../controllers/tag.controller.js";

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

export default router;
