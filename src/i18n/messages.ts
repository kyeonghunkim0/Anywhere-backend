// ============================================
// 다국어 메시지 카탈로그
// ============================================
// - 키는 "도메인.의미" 형태의 문자열입니다. 이 키가 곧 에러 응답의 code 필드가 됩니다.
// - 값은 지원 로케일(ko/en/ja/zh) 전체를 채워야 합니다 (satisfies로 강제).
// - "{name}" 자리표시자는 translate()가 params로 치환합니다.

import type { Locale } from "./locales.js";

type Entry = Record<Locale, string>;

export const messages = {
  // ---------- 공통 ----------
  "common.serverError": {
    ko: "서버 오류가 발생했습니다.",
    en: "An internal server error occurred.",
    ja: "サーバーエラーが発生しました。",
    zh: "服务器发生错误。",
  },
  "common.duplicate": {
    ko: "이미 존재하는 데이터입니다.",
    en: "This data already exists.",
    ja: "すでに存在するデータです。",
    zh: "该数据已存在。",
  },
  "common.notFound": {
    ko: "요청하신 데이터를 찾을 수 없습니다.",
    en: "The requested data could not be found.",
    ja: "リクエストされたデータが見つかりません。",
    zh: "找不到请求的数据。",
  },
  "common.routeNotFound": {
    ko: "요청하신 경로를 찾을 수 없습니다. ({method} {path})",
    en: "The requested route was not found. ({method} {path})",
    ja: "リクエストされたパスが見つかりません。({method} {path})",
    zh: "找不到请求的路径。({method} {path})",
  },
  "common.invalidJson": {
    ko: "요청 본문이 올바른 JSON 형식이 아닙니다.",
    en: "The request body is not valid JSON.",
    ja: "リクエスト本文が正しいJSON形式ではありません。",
    zh: "请求正文不是有效的 JSON 格式。",
  },
  "common.saved": {
    ko: "저장되었습니다.",
    en: "Saved.",
    ja: "保存しました。",
    zh: "已保存。",
  },
  "common.settingsSaved": {
    ko: "설정이 저장되었습니다.",
    en: "Your settings have been saved.",
    ja: "設定を保存しました。",
    zh: "设置已保存。",
  },

  // ---------- 페이징 / 입력 검증 ----------
  "validation.pagingRange": {
    ko: "{label}은(는) {min}~{max} 사이의 숫자여야 합니다.",
    en: "{label} must be a number between {min} and {max}.",
    ja: "{label}は{min}〜{max}の数値である必要があります。",
    zh: "{label} 必须是 {min} 到 {max} 之间的数字。",
  },
  "validation.userIdRequired": {
    ko: "userId는 필수입니다.",
    en: "userId is required.",
    ja: "userIdは必須です。",
    zh: "userId 为必填项。",
  },

  // ---------- 인증 ----------
  "auth.credentialsMissing": {
    ko: "인증 정보가 없습니다.",
    en: "Authentication information is missing.",
    ja: "認証情報がありません。",
    zh: "缺少身份验证信息。",
  },
  "auth.tokenRequired": {
    ko: "인증 토큰이 필요합니다. Authorization 헤더를 확인해주세요.",
    en: "An authentication token is required. Please check the Authorization header.",
    ja: "認証トークンが必要です。Authorizationヘッダーを確認してください。",
    zh: "需要身份验证令牌，请检查 Authorization 请求头。",
  },
  "auth.tokenExpired": {
    ko: "토큰이 만료되었습니다. 다시 로그인해주세요.",
    en: "Your token has expired. Please sign in again.",
    ja: "トークンの有効期限が切れました。再度ログインしてください。",
    zh: "令牌已过期，请重新登录。",
  },
  "auth.tokenInvalid": {
    ko: "유효하지 않은 토큰입니다.",
    en: "The token is invalid.",
    ja: "無効なトークンです。",
    zh: "令牌无效。",
  },
  "auth.appleTokenInvalid": {
    ko: "유효하지 않은 Apple idToken입니다.",
    en: "The Apple idToken is invalid.",
    ja: "無効なApple idTokenです。",
    zh: "Apple idToken 无效。",
  },
  "auth.googleTokenInvalid": {
    ko: "유효하지 않은 Google idToken입니다.",
    en: "The Google idToken is invalid.",
    ja: "無効なGoogle idTokenです。",
    zh: "Google idToken 无效。",
  },
  "auth.socialTypeRequired": {
    ko: "socialType은 필수입니다.",
    en: "socialType is required.",
    ja: "socialTypeは必須です。",
    zh: "socialType 为必填项。",
  },
  "auth.socialTypeInvalid": {
    ko: "socialType은 'apple' 또는 'google'만 가능합니다.",
    en: "socialType must be either 'apple' or 'google'.",
    ja: "socialTypeは'apple'または'google'のみ指定できます。",
    zh: "socialType 只能是 'apple' 或 'google'。",
  },
  "auth.idTokenRequired": {
    ko: "idToken은 필수입니다.",
    en: "idToken is required.",
    ja: "idTokenは必須です。",
    zh: "idToken 为必填项。",
  },
  "auth.idTokenVerificationFailed": {
    ko: "idToken 검증에 실패했습니다.",
    en: "idToken verification failed.",
    ja: "idTokenの検証に失敗しました。",
    zh: "idToken 验证失败。",
  },
  "auth.signupComplete": {
    ko: "회원가입 완료",
    en: "Sign-up complete",
    ja: "会員登録が完了しました",
    zh: "注册完成",
  },
  "auth.loginSuccess": {
    ko: "로그인 성공",
    en: "Signed in successfully",
    ja: "ログインに成功しました",
    zh: "登录成功",
  },
  "auth.deviceIdRequired": {
    ko: "deviceId는 필수입니다.",
    en: "deviceId is required.",
    ja: "deviceIdは必須です。",
    zh: "deviceId 为必填项。",
  },
  "auth.guestSignupComplete": {
    ko: "게스트 계정 생성 완료",
    en: "Guest account created",
    ja: "ゲストアカウントの作成が完了しました",
    zh: "访客账号创建完成",
  },
  "auth.guestLoginSuccess": {
    ko: "게스트 로그인 성공",
    en: "Signed in as guest",
    ja: "ゲストログインに成功しました",
    zh: "访客登录成功",
  },
  "auth.deviceAlreadyLinked": {
    ko: "이미 정회원으로 전환된 deviceId입니다.",
    en: "This deviceId has already been upgraded to a full account.",
    ja: "このdeviceIdはすでに正会員に切り替わっています。",
    zh: "该 deviceId 已升级为正式会员账号。",
  },
  "auth.notGuestUser": {
    ko: "게스트 계정이 아닙니다.",
    en: "This account is not a guest account.",
    ja: "ゲストアカウントではありません。",
    zh: "该账号不是访客账号。",
  },
  "auth.socialAccountAlreadyLinked": {
    ko: "이미 다른 계정에 연결된 소셜 계정입니다.",
    en: "This social account is already linked to another account.",
    ja: "すでに別のアカウントに連携済みのソーシャルアカウントです。",
    zh: "该社交账号已绑定到另一个账号。",
  },
  "auth.guestUpgradeSuccess": {
    ko: "정회원 전환 완료",
    en: "Upgraded to a full account",
    ja: "正会員への切り替えが完了しました",
    zh: "已升级为正式会员",
  },

  // ---------- 검색 ----------
  "search.queryRequired": {
    ko: "검색어(q)를 입력해주세요.",
    en: "Please enter a search term (q).",
    ja: "検索語(q)を入力してください。",
    zh: "请输入搜索关键词(q)。",
  },
  "search.regionGroupInvalid": {
    ko: "regionGroup은 다음 중 하나여야 합니다: {options}",
    en: "regionGroup must be one of: {options}",
    ja: "regionGroupは次のいずれかである必要があります: {options}",
    zh: "regionGroup 必须是以下之一：{options}",
  },

  // ---------- 후기 ----------
  "review.placeIdContentRequired": {
    ko: "placeId와 content는 필수입니다.",
    en: "placeId and content are required.",
    ja: "placeIdとcontentは必須です。",
    zh: "placeId 和 content 为必填项。",
  },
  "review.contentRequired": {
    ko: "후기 내용을 입력해주세요.",
    en: "Please enter your review.",
    ja: "レビュー内容を入力してください。",
    zh: "请输入评价内容。",
  },
  "review.contentTooLong": {
    ko: "후기는 {max}자 이내로 작성해주세요.",
    en: "Reviews must be {max} characters or fewer.",
    ja: "レビューは{max}文字以内で入力してください。",
    zh: "评价内容请控制在 {max} 字以内。",
  },

  // ---------- 체크인 (미션) ----------
  "mission.paramsRequired": {
    ko: "placeId, lat(위도), lng(경도)은 필수입니다.",
    en: "placeId, lat (latitude), and lng (longitude) are required.",
    ja: "placeId、lat(緯度)、lng(経度)は必須です。",
    zh: "placeId、lat（纬度）、lng（经度）为必填项。",
  },
  "mission.tooFar": {
    ko: "현재 위치가 목적지에서 500m 이상 떨어져 있습니다. 더 가까이 이동해주세요!",
    en: "You are more than 500m from the destination. Please move closer!",
    ja: "現在地が目的地から500m以上離れています。もっと近づいてください！",
    zh: "当前位置距目的地超过 500 米，请再靠近一些！",
  },
  "mission.alreadyCheckedInToday": {
    ko: "오늘 이미 이 장소에 체크인하셨습니다. 내일 다시 방문해주세요!",
    en: "You have already checked in here today. Please come back tomorrow!",
    ja: "本日すでにこの場所でチェックイン済みです。明日また訪れてください！",
    zh: "您今天已在此地点签到，请明天再来！",
  },
  "mission.checkInSuccessBonus": {
    ko: "🎉 {placeName} 방문 인증 완료! 🌟 로컬 상생 지역 보너스! 도장 {count}개 획득!",
    en: "🎉 Visit to {placeName} verified! 🌟 Local revitalization bonus! You earned {count} stamps!",
    ja: "🎉 {placeName}の訪問認証が完了しました！🌟 地域活性化ボーナス！スタンプ{count}個獲得！",
    zh: "🎉 已完成 {placeName} 的到访认证！🌟 地方振兴奖励！获得 {count} 个印章！",
  },
  "mission.checkInSuccessNormal": {
    ko: "🎉 {placeName} 방문 인증 완료! 도장 {count}개 획득!",
    en: "🎉 Visit to {placeName} verified! You earned {count} stamps!",
    ja: "🎉 {placeName}の訪問認証が完了しました！スタンプ{count}個獲得！",
    zh: "🎉 已完成 {placeName} 的到访认证！获得 {count} 个印章！",
  },

  // ---------- 매칭 ----------
  "match.dailyLimitExceeded": {
    ko: "오늘의 매칭 횟수({max}회)를 모두 사용했습니다. 내일 다시 시도해주세요!",
    en: "You have used all of today's matches ({max}). Please try again tomorrow!",
    ja: "本日のマッチング回数({max}回)をすべて使い切りました。明日再度お試しください！",
    zh: "您已用完今天的匹配次数（{max} 次），请明天再试！",
  },
  "match.latLngRequired": {
    ko: "lat(위도)과 lng(경도)은 필수 쿼리 파라미터입니다.",
    en: "lat (latitude) and lng (longitude) are required query parameters.",
    ja: "lat(緯度)とlng(経度)は必須のクエリパラメータです。",
    zh: "lat（纬度）和 lng（经度）为必需的查询参数。",
  },
  "match.noMatchNearby": {
    ko: "주변에 매칭 가능한 관광지가 없습니다. 반경을 넓혀보세요.",
    en: "There are no matchable attractions nearby. Try widening the radius.",
    ja: "周辺にマッチング可能な観光地がありません。範囲を広げてみてください。",
    zh: "附近没有可匹配的景点，请尝试扩大范围。",
  },
  "match.tripCancelled": {
    ko: "여정을 취소했습니다.",
    en: "Your trip has been cancelled.",
    ja: "旅程をキャンセルしました。",
    zh: "行程已取消。",
  },
  "match.notFound": {
    ko: "존재하지 않는 매칭입니다.",
    en: "This match does not exist.",
    ja: "存在しないマッチングです。",
    zh: "该匹配不存在。",
  },
  "match.cancelledCannotConfirm": {
    ko: "취소된 매칭은 확정할 수 없습니다.",
    en: "A cancelled match cannot be confirmed.",
    ja: "キャンセルされたマッチングは確定できません。",
    zh: "已取消的匹配无法确认。",
  },
  "match.alreadyCheckedIn": {
    ko: "이미 체크인이 완료된 매칭입니다.",
    en: "This match has already been checked in.",
    ja: "すでにチェックイン済みのマッチングです。",
    zh: "该匹配已完成签到。",
  },
  "match.checkedInCannotCancel": {
    ko: "이미 체크인이 완료된 매칭은 취소할 수 없습니다.",
    en: "A match that has already been checked in cannot be cancelled.",
    ja: "すでにチェックイン済みのマッチングはキャンセルできません。",
    zh: "已完成签到的匹配无法取消。",
  },

  // ---------- 유저 ----------
  "user.nicknameTooLong": {
    ko: "닉네임은 {max}자 이내로 입력해주세요.",
    en: "Your nickname must be {max} characters or fewer.",
    ja: "ニックネームは{max}文字以内で入力してください。",
    zh: "昵称请控制在 {max} 字以内。",
  },
  "user.pushEnabledRequired": {
    ko: "pushEnabled(boolean)는 필수입니다.",
    en: "pushEnabled (boolean) is required.",
    ja: "pushEnabled(boolean)は必須です。",
    zh: "pushEnabled（布尔值）为必填项。",
  },
  "user.notFound": {
    ko: "존재하지 않는 사용자입니다.",
    en: "This user does not exist.",
    ja: "存在しないユーザーです。",
    zh: "该用户不存在。",
  },

  // ---------- 관광지 / 지역 ----------
  "place.coordsInvalid": {
    ko: "lat와 lng는 함께, 유효한 좌표 범위로 넘겨주세요.",
    en: "Provide lat and lng together as a valid coordinate pair.",
    ja: "latとlngは有効な座標として一緒に指定してください。",
    zh: "请同时提供有效范围内的 lat 与 lng。",
  },
  "place.notFound": {
    ko: "존재하지 않는 관광지입니다.",
    en: "This attraction does not exist.",
    ja: "存在しない観光地です。",
    zh: "该景点不存在。",
  },
  "place.idRequired": {
    ko: "placeId는 필수입니다.",
    en: "placeId is required.",
    ja: "placeIdは必須です。",
    zh: "placeId 为必填项。",
  },
  "region.notFound": {
    ko: "존재하지 않는 지역입니다.",
    en: "This region does not exist.",
    ja: "存在しない地域です。",
    zh: "该地区不存在。",
  },
} satisfies Record<string, Entry>;

export type MessageKey = keyof typeof messages;
