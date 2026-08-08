import { Request, Response } from "express";
import { loginWithSocial } from "../services/auth.service.js";

/**
 * POST /api/auth/login
 * 
 * Request Body:
 * {
 *   "socialType": "apple" | "google",
 *   "socialId": "소셜 플랫폼에서 받은 고유 ID",
 *   "nickname": "(선택) 닉네임"
 * }
 */
export async function loginController(req: Request, res: Response): Promise<void> {
  try {
    const { socialType, socialId, nickname } = req.body;

    // 입력값 검증
    if (!socialType || !socialId) {
      res.status(400).json({
        success: false,
        message: "socialType과 socialId는 필수입니다.",
      });
      return;
    }

    if (!["apple", "google"].includes(socialType)) {
      res.status(400).json({
        success: false,
        message: "socialType은 'apple' 또는 'google'만 가능합니다.",
      });
      return;
    }

    const result = await loginWithSocial({ socialType, socialId, nickname });

    res.status(result.isNewUser ? 201 : 200).json({
      success: true,
      message: result.isNewUser ? "회원가입 완료" : "로그인 성공",
      data: {
        token: result.token,
        user: result.user,
      },
    });
  } catch (error) {
    console.error("로그인 에러:", error);
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
}
