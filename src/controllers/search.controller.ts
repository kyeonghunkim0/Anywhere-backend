import { Request, Response } from "express";
import { search } from "../services/search.service.js";
import { respondWithError } from "../middlewares/error.middleware.js";

/**
 * GET /api/search?q=포항&limit=20&offset=0
 * 지역 이름 + 관광지 이름·주소 통합 검색 (인증 불필요, 시·군 단위만)
 */
export async function searchController(req: Request, res: Response): Promise<void> {
  try {
    const q = (req.query.q as string | undefined) ?? "";

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;

    if (isNaN(limit) || limit < 1 || limit > 50) {
      res.status(400).json({ success: false, message: "limit은 1~50 사이의 숫자여야 합니다." });
      return;
    }
    if (isNaN(offset) || offset < 0) {
      res.status(400).json({ success: false, message: "offset은 0 이상의 숫자여야 합니다." });
      return;
    }

    const result = await search(q, limit, offset);
    res.json({ success: true, data: result });
  } catch (error) {
    respondWithError(res, error, "통합 검색");
  }
}
