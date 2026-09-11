import cron from "node-cron";
import { env } from "../config/env.js";
import { cleanupExpiredGuests } from "../services/auth.service.js";

/**
 * 만료된 게스트(비회원) 계정 정리 크론잡
 * 기본: 매시 정각 (GUEST_CLEANUP_CRON_SCHEDULE 환경변수로 변경 가능)
 */
export function startCleanupGuestsJob(): void {
  const schedule = env.GUEST_CLEANUP_CRON_SCHEDULE;

  if (!cron.validate(schedule)) {
    console.error(`❌ 유효하지 않은 크론 스케줄: ${schedule}`);
    return;
  }

  cron.schedule(schedule, async () => {
    try {
      const deletedCount = await cleanupExpiredGuests();
      if (deletedCount > 0) {
        console.log(`🧹 만료 게스트 계정 ${deletedCount}건 정리 완료`);
      }
    } catch (error) {
      console.error("🚨 만료 게스트 정리 크론잡 실패:", error);
    }
  });

  console.log(`📅 만료 게스트 정리 크론잡 등록 완료 (스케줄: ${schedule})`);
}
