import { Router } from "express";
import { getPlaceDetailController } from "../controllers/place.controller.js";

const router = Router();

/**
 * GET /api/places/:placeId
 * 장소 상세 (공개 조회)
 */
router.get("/:placeId", getPlaceDetailController);

export default router;
