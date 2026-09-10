// ============================================
// 지원 로케일 정의 · Accept-Language 파싱
// ============================================

/** 서버가 메시지를 제공하는 언어 목록. 첫 번째가 기본값입니다. */
export const SUPPORTED_LOCALES = ["ko", "en", "ja", "zh"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

/** Accept-Language가 없거나 지원하지 않는 언어일 때 사용하는 기본 로케일 */
export const DEFAULT_LOCALE: Locale = "ko";

/** 문자열이 지원 로케일인지 좁혀줍니다. */
export function isSupportedLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/**
 * Accept-Language 헤더 문자열을 파싱해 지원하는 로케일 하나를 고릅니다.
 * 예: "en-US,en;q=0.9,ko;q=0.8" → "en"
 * q 값이 높은 순서로 검사하고, 매칭되는 것이 없으면 DEFAULT_LOCALE를 반환합니다.
 */
export function resolveLocale(header?: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? parseFloat(qParam.split("=")[1]) : 1;
      return { tag: tag.trim().toLowerCase(), q: Number.isNaN(q) ? 0 : q };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const primary = tag.split("-")[0];
    if (isSupportedLocale(primary)) return primary;
  }

  return DEFAULT_LOCALE;
}
