import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { getPassport } from "../services/passport.service.js";

/**
 * GET /api/passport/:userId
 */
export async function getPassportController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string;

    if (!userId) {
      res.status(400).json({
        success: false,
        message: "userId는 필수입니다.",
      });
      return;
    }

    const result = await getPassport(userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("여권 조회 에러:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
}
