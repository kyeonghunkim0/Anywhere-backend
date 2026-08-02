import { Request, Response } from "express";
import { getGrowthRegions, getRegionDetail } from "../services/region.service.js";

/**
 * GET /api/regions/growth
 */
export async function getGrowthRegionsController(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const regions = await getGrowthRegions(limit);
    res.json({ success: true, data: regions });
  } catch (error) {
    console.error("성장 지역 조회 에러:", error);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
}

/**
 * GET /api/regions/:regionId
 */
export async function getRegionDetailController(req: Request, res: Response): Promise<void> {
  try {
    const regionId = req.params.regionId as string;
    const result = await getRegionDetail(regionId);
    res.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof Error && error.message === "존재하지 않는 지역입니다.") {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    console.error("지역 상세 조회 에러:", error);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
}
