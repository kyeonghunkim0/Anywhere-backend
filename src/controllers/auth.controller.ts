import { Request, Response } from "express";
import { loginWithSocial, IdTokenVerificationError } from "../services/auth.service.js";

/**
 * POST /api/auth/login
 *
 * Request Body:
 * {
 *   "socialType": "apple" | "google",
 *   "idToken": "필수 — google: GIDGoogleUser.idToken.tokenString / apple: ASAuthorizationAppleIDCredential.identityToken",
 *   "nickname": "(선택) 닉네임"
 * }
 */
export async function loginController(req: Request, res: Response): Promise<void> {
  try {
    const { socialType, idToken, nickname } = req.body;

    if (!socialType) {
      res.status(400).json({
        success: false,
        message: "socialType은 필수입니다.",
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

    if (!idToken) {
      res.status(400).json({
        success: false,
        message: "idToken은 필수입니다.",
      });
      return;
    }

    const result = await loginWithSocial({ socialType, idToken, nickname });

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
    if (error instanceof IdTokenVerificationError) {
      res.status(401).json({
        success: false,
        message: "idToken 검증에 실패했습니다.",
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: "서버 오류가 발생했습니다.",
    });
  }
}
