import { Request, Response } from "express";
import { env } from "../config/env.js";

/**
 * "1.2.3" 형태의 버전 문자열 비교
 * @returns a가 b보다 작으면 음수, 크면 양수, 같으면 0
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);
  const length = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < length; i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }

  return 0;
}

/**
 * platform 쿼리값에 맞는 스토어 링크를 반환합니다.
 * - ios: App Store · android: Play Store · 그 외/미지정: 빈 문자열
 */
function resolveStoreUrl(platform: string | undefined): string {
  if (platform === "ios") return env.APP_STORE_URL;
  if (platform === "android") return env.PLAY_STORE_URL;
  return "";
}

/**
 * GET /api/app/info?version=1.0.0&platform=ios
 *
 * 앱 최초 실행 시 호출하여 강제 업데이트 여부와 점검 상태를 확인합니다.
 * - version: 클라이언트 버전. APP_MIN_VERSION 미만이면 forceUpdate=true (강제 업데이트)
 * - platform: ios | android. 해당 스토어 링크를 storeUrl로 내려줍니다.
 */
export function getAppInfoController(req: Request, res: Response): void {
  const clientVersion = req.query.version as string | undefined;
  const platform = req.query.platform as string | undefined;

  const forceUpdate = clientVersion
    ? compareVersions(clientVersion, env.APP_MIN_VERSION) < 0
    : false;

  // 강제는 아니지만 최신 버전이 나와 있는 경우 (선택 업데이트 안내용)
  const updateAvailable = clientVersion
    ? compareVersions(clientVersion, env.APP_LATEST_VERSION) < 0
    : false;

  res.json({
    success: true,
    data: {
      appName: "아무데나",
      latestVersion: env.APP_LATEST_VERSION,
      minVersion: env.APP_MIN_VERSION,
      forceUpdate,
      updateAvailable,
      updateMessage: forceUpdate || updateAvailable ? env.APP_UPDATE_MESSAGE : null,
      storeUrl: resolveStoreUrl(platform),
      maintenanceMode: env.MAINTENANCE_MODE,
      maintenanceMessage: env.MAINTENANCE_MODE ? env.MAINTENANCE_MESSAGE : null,
      serverTime: new Date().toISOString(),
    },
  });
}
