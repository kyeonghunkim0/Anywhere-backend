// ============================================
// i18n 공개 API
// ============================================

export {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  isSupportedLocale,
  resolveLocale,
  type Locale,
} from "./locales.js";
export { messages, type MessageKey } from "./messages.js";
export { translate, type MessageParams } from "./translate.js";
