import { Router } from "express";
import { searchController } from "../controllers/search.controller.js";

const router = Router();

/**
 * GET /api/search?q=&limit=&offset=
 * 지역 + 관광지 통합 검색 (인증 불필요)
 */
router.get("/", searchController);

export default router;
