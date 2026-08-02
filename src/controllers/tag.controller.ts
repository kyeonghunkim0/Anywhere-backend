import { Request, Response } from "express";
import { getTags, getPlacesByTag } from "../services/tag.service.js";

/**
 * GET /api/tags
 */
export async function getTagsController(_req: Request, res: Response): Promise<void> {
  try {
    const tags = await getTags();
    res.json({ success: true, data: tags });
  } catch (error) {
    console.error("태그 조회 에러:", error);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
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
    console.error("태그별 관광지 조회 에러:", error);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
}
