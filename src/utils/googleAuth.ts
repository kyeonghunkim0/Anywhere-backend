import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export interface GoogleIdTokenPayload {
  sub: string;
  email?: string;
  name?: string;
}

/**
 * 클라이언트가 보낸 Google idToken을 Google 공개키로 검증합니다.
 * 여기서 나온 sub(고유 유저 ID)만 신뢰할 수 있는 socialId입니다 —
 * 클라이언트가 body로 보낸 socialId는 스푸핑 가능하므로 사용하지 않습니다.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdTokenPayload> {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload?.sub) {
    throw new Error("유효하지 않은 Google idToken입니다.");
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
  };
}
