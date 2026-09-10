import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { getPassport } from "../services/passport.service.js";
import { respondWithError, respondFail } from "../middlewares/error.middleware.js";

/**
 * GET /api/passport/:userId
 */
export async function getPassportController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string;

    if (!userId) {
      respondFail(res, 400, "validation.userIdRequired");
      return;
    }

    const result = await getPassport(userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    respondWithError(res, error, "여권 조회");
  }
}
