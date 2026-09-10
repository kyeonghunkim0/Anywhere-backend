// ============================================
// 메시지 키 → 로케일별 문자열 변환
// ============================================

import { DEFAULT_LOCALE, type Locale } from "./locales.js";
import { messages, type MessageKey } from "./messages.js";

/** "{name}" 자리표시자에 채워 넣을 값 */
export type MessageParams = Record<string, string | number>;

/** 템플릿의 "{name}" 을 params 값으로 치환합니다. 없는 키는 그대로 둡니다. */
function interpolate(template: string, params?: MessageParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match
  );
}

/**
 * 메시지 키를 해당 로케일 문자열로 변환합니다.
 * 로케일 값이 없으면 기본 로케일 → 키 문자열 순으로 폴백합니다.
 */
export function translate(key: MessageKey, locale: Locale, params?: MessageParams): string {
  const entry = messages[key] as Record<Locale, string> | undefined;
  const template = entry?.[locale] ?? entry?.[DEFAULT_LOCALE] ?? key;
  return interpolate(template, params);
}
