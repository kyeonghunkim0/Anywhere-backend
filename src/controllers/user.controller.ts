import { Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware.js";
import { respondWithError, respondFail, localize } from "../middlewares/error.middleware.js";
import {
  getMyProfile,
  getMyProfileStats,
  updateMyProfile,
  updateMySettings,
  deleteMyAccount,
  blockUser,
  unblockUser,
  getMyBlockedUsers,
  getRankerDetail,
} from "../services/user.service.js";

/**
 * GET /api/users/me
 */
export async function getMyProfileController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      respondFail(res, 401, "auth.credentialsMissing");
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
      respondFail(res, 401, "auth.credentialsMissing");
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
      respondFail(res, 401, "auth.credentialsMissing");
      return;
    }

    const { nickname, profileImage } = req.body;
    const profile = await updateMyProfile(userId, { nickname, profileImage });
    res.json({ success: true, message: localize(res, "common.saved"), data: profile });
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
      respondFail(res, 401, "auth.credentialsMissing");
      return;
    }

    const { pushEnabled } = req.body;
    if (typeof pushEnabled !== "boolean") {
      respondFail(res, 400, "user.pushEnabledRequired");
      return;
    }

    const profile = await updateMySettings(userId, pushEnabled);
    res.json({ success: true, message: localize(res, "common.settingsSaved"), data: profile });
  } catch (error) {
    respondWithError(res, error, "설정 수정");
  }
}

/**
 * DELETE /api/users/me
 * 회원 탈퇴
 */
export async function deleteMyAccountController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      respondFail(res, 401, "auth.credentialsMissing");
      return;
    }

    await deleteMyAccount(userId);
    res.json({ success: true, message: localize(res, "user.withdrawn") });
  } catch (error) {
    respondWithError(res, error, "회원 탈퇴");
  }
}

/**
 * POST /api/users/:userId/block
 * 사용자 차단
 */
export async function blockUserController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const blockerId = req.user?.userId;
    if (!blockerId) {
      respondFail(res, 401, "auth.credentialsMissing");
      return;
    }

    const blockedId = req.params.userId as string;
    await blockUser(blockerId, blockedId);
    res.status(201).json({ success: true, data: { blockedId } });
  } catch (error) {
    respondWithError(res, error, "사용자 차단");
  }
}

/**
 * DELETE /api/users/:userId/block
 * 사용자 차단 해제
 */
export async function unblockUserController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const blockerId = req.user?.userId;
    if (!blockerId) {
      respondFail(res, 401, "auth.credentialsMissing");
      return;
    }

    const blockedId = req.params.userId as string;
    await unblockUser(blockerId, blockedId);
    res.json({ success: true, data: { blockedId } });
  } catch (error) {
    respondWithError(res, error, "사용자 차단 해제");
  }
}

/**
 * GET /api/users/me/blocks
 * 내가 차단한 사용자 목록
 */
export async function getMyBlockedUsersController(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      respondFail(res, 401, "auth.credentialsMissing");
      return;
    }

    const result = await getMyBlockedUsers(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    respondWithError(res, error, "차단 목록 조회");
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
