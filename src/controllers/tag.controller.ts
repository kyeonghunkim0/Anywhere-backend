import { Request, Response } from "express";
import { getTags, getPlacesByTag } from "../services/tag.service.js";
import { respondWithError } from "../middlewares/error.middleware.js";

/**
 * GET /api/tags
 */
export async function getTagsController(_req: Request, res: Response): Promise<void> {
  try {
    const tags = await getTags();
    res.json({ success: true, data: tags });
  } catch (error) {
    respondWithError(res, error, "태그 조회");
  }
}

/**
 * GET /api/tags/:tagId/places
 */
export async function getPlacesByTagController(req: Request, res: Response): Promise<void> {
  try {
    const tagId = req.params.tagId as string;
    const places = await getPlacesByTag(tagId);
    res.json({ success: true, data: places });
  } catch (error) {
    respondWithError(res, error, "태그별 관광지 조회");
  }
}
