import axios from "axios";

// ============================================
// TourAPI 계열(KorService2 · PhotoGalleryService1) 공통 호출 유틸
// ============================================

/** 재시도해볼 만한 실패인지 판별합니다 (네트워크 오류 · 429 · 5xx). */
export function isRetryable(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  if (status === undefined) return true; // 응답 자체를 못 받음 = 네트워크 오류
  return status === 429 || status >= 500;
}

/** 지정한 밀리초만큼 대기합니다. */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
