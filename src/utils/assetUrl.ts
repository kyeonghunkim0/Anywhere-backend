import { env } from "../config/env.js";

// ============================================
// 정적 에셋 URL 변환
// ============================================

/**
 * DB에 저장된 아이콘/이미지 값을 클라이언트가 바로 로드할 수 있는 형태로 변환한다.
 *
 * - 이미 절대 URL(`http://`, `https://`)이면 그대로 반환한다. (예: Region.imageUrl)
 * - 슬래시·확장자가 없는 값은 앱 번들 에셋 키로 보고 그대로 반환한다. (예: "fish", "cherry-blossom")
 * - 그 외(`badges/xxx.png` 같은 상대 경로)는 `PUBLIC_BASE_URL/static/` 를 붙여 절대 URL로 만든다.
 */
export function toPublicAssetUrl(value: string | null): string | null {
  if (!value) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (!value.includes("/") && !value.includes(".")) return value;
  return `${env.PUBLIC_BASE_URL}/static/${value.replace(/^\/+/, "")}`;
}
