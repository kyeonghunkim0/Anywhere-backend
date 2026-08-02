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
 * GET /api/app/info?version=1.0.0
 *
 * 앱 최초 실행 시 호출하여 강제 업데이트 여부와 점검 상태를 확인합니다.
 */
export function getAppInfoController(req: Request, res: Response): void {
  const clientVersion = req.query.version as string | undefined;

  const forceUpdate = clientVersion
    ? compareVersions(clientVersion, env.APP_MIN_VERSION) < 0
    : false;

  res.json({
    success: true,
    data: {
      appName: "아무데나",
      latestVersion: env.APP_LATEST_VERSION,
      minVersion: env.APP_MIN_VERSION,
      forceUpdate,
      maintenanceMode: env.MAINTENANCE_MODE,
      maintenanceMessage: env.MAINTENANCE_MODE ? env.MAINTENANCE_MESSAGE : null,
      serverTime: new Date().toISOString(),
    },
  });
}
