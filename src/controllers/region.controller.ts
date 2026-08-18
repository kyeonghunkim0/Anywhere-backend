import { Request, Response } from "express";
import { getGrowthRegions, getRegionDetail } from "../services/region.service.js";
import { respondWithError } from "../middlewares/error.middleware.js";

/**
 * GET /api/regions/growth
 */
export async function getGrowthRegionsController(req: Request, res: Response): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const regions = await getGrowthRegions(limit);
    res.json({ success: true, data: regions });
  } catch (error) {
    respondWithError(res, error, "성장 지역 조회");
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
    respondWithError(res, error, "지역 상세 조회");
  }
}
