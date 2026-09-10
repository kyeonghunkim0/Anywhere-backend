import { Router } from "express";
import { getGrowthRegionsController, getRegionDetailController } from "../controllers/region.controller.js";

const router = Router();

/**
 * GET /api/regions/growth
 * 레벨업 임박한 인구감소지역 리스트 ([함께 키우는 로컬 성장 게이지])
 */
router.get("/growth", getGrowthRegionsController);

/**
 * GET /api/regions/:regionId
 * 지역 상세 (레벨, 성장 게이지, 통계, 레벨 보상 현황)
 */
router.get("/:regionId", getRegionDetailController);

export default router;
