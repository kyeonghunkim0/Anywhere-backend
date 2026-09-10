import { Request, Response } from "express";
import { loginWithSocial } from "../services/auth.service.js";
import { respondWithError, respondFail, localize } from "../middlewares/error.middleware.js";

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
      respondFail(res, 400, "auth.socialTypeRequired");
      return;
    }

    if (!["apple", "google"].includes(socialType)) {
      respondFail(res, 400, "auth.socialTypeInvalid");
      return;
    }

    if (!idToken) {
      respondFail(res, 400, "auth.idTokenRequired");
      return;
    }

    const result = await loginWithSocial({ socialType, idToken, nickname });

    res.status(result.isNewUser ? 201 : 200).json({
      success: true,
      message: localize(res, result.isNewUser ? "auth.signupComplete" : "auth.loginSuccess"),
      data: {
        token: result.token,
        user: result.user,
      },
    });
  } catch (error) {
    respondWithError(res, error, "로그인");
  }
}
