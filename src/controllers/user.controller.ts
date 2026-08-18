import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { respondWithError } from "../middlewares/error.middleware.js";
import {
  getMyProfile,
  getMyProfileStats,
  updateMyProfile,
  updateMySettings,
  getRankerDetail,
} from "../services/user.service.js";

/**
 * GET /api/users/me
 */
export async function getMyProfileController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "인증 정보가 없습니다." });
      return;
    }

    const profile = await getMyProfile(userId);
    res.json({ success: true, data: profile });
  } catch (error) {
    respondWithError(res, error, "프로필 조회");
  }
}

/**
 * GET /api/users/me/stats
 * 프로필 화면 - 수집 도시 / 소멸지역 기여도 / 누적 이동 거리 / 기록 섹션
 */
export async function getMyProfileStatsController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "인증 정보가 없습니다." });
      return;
    }

    const stats = await getMyProfileStats(userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    respondWithError(res, error, "프로필 통계 조회");
  }
}

/**
 * PATCH /api/users/me
 * Body: { nickname?: string, profileImage?: string }
 */
export async function updateMyProfileController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "인증 정보가 없습니다." });
      return;
    }

    const { nickname, profileImage } = req.body;
    const profile = await updateMyProfile(userId, { nickname, profileImage });
    res.json({ success: true, message: "저장되었습니다.", data: profile });
  } catch (error) {
    respondWithError(res, error, "프로필 수정");
  }
}

/**
 * PATCH /api/users/me/settings
 * Body: { pushEnabled: boolean }
 */
export async function updateMySettingsController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "인증 정보가 없습니다." });
      return;
    }

    const { pushEnabled } = req.body;
    if (typeof pushEnabled !== "boolean") {
      res.status(400).json({ success: false, message: "pushEnabled(boolean)는 필수입니다." });
      return;
    }

    const profile = await updateMySettings(userId, pushEnabled);
    res.json({ success: true, message: "설정이 저장되었습니다.", data: profile });
  } catch (error) {
    respondWithError(res, error, "설정 수정");
  }
}

/**
 * GET /api/users/:userId/detail
 */
export async function getRankerDetailController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.params.userId as string;
    const detail = await getRankerDetail(userId);
    res.json({ success: true, data: detail });
  } catch (error) {
    respondWithError(res, error, "유저 상세 조회");
  }
}
