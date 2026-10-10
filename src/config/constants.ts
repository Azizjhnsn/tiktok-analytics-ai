import type { Enrichment } from '@/types/enrichment';
import { ENV } from './env';
import type { Settings } from '@/types/settings';

export const APP_NAME = 'TikTok Analytics Collector';
export const EXPORT_SCHEMA_VERSION = 2;

export const STUDIO_MATCH = 'https://www.tiktok.com/tiktokstudio/*';
export const TIKTOK_ORIGIN = 'https://www.tiktok.com';
export const STUDIO_BASE_URL = `${TIKTOK_ORIGIN}/tiktokstudio`;

/** Tag on window.postMessage between the MAIN-world interceptor and the isolated content script. */
export const BRIDGE_SOURCE = 'tt-analytics-collector';

export const ITEM_LIST_PATH = '/tiktok/creator/manage/item_list/v1/';

/** Request paths whose responses are captured in full. See docs/endpoints.md. */
export const CAPTURE_PATH_PATTERNS: RegExp[] = [
  /^\/aweme\/v2\/data\/insight\/?$/,
  /^\/tiktok\/v1\/analytics\/insights\/?$/,
  /^\/tiktok\/creator\/manage\/item_list\//,
  /^\/tiktokstudio\/api\/web\/user\/?$/,
  /^\/tiktok\/v1\/creator\/ai_comment\//,
  /(insight|analytics)/i,
];

export const RETENTION_KEY = 'video_retention_rate_realtime';
/** Response keys that change on every call (request ids, server time). Ignored for de-duplication. */
export const VOLATILE_BODY_KEYS = ['extra', 'log_pb'];
export const NON_INSIGHT_BODY_KEYS = ['status_code', 'status_msg', ...VOLATILE_BODY_KEYS];
export const INSIGHT_PATH_PATTERN = /insight/i;
/** Post-list `visibility` value for videos set to 'Only me'. */
export const PRIVATE_VISIBILITY = 2;
export const USER_PATH = '/tiktokstudio/api/web/user';

/** Studio page path holding a video ID, e.g. /tiktokstudio/analytics/7435925695869501496/viewers */
export const VIDEO_PAGE_PATTERN = /\/tiktokstudio\/analytics\/(\d{15,})/;

/** Guided walk pages. */
export const POSTS_PAGE_URL = `${STUDIO_BASE_URL}/content`;
export const ACCOUNT_PAGE_TABS = ['overview', 'content', 'viewers', 'followers'];
/** Studio's date-range presets (days). Set via the page URL's `dateRange` param, the same as picking it in Studio. */
export const DATE_RANGE_OPTIONS = [7, 28, 60, 365];
/** Studio's `range` request codes → days (verified in Studio). */
export const RANGE_CODE_DAYS: Record<number, number> = { 1: 7, 2: 28, 3: 60, 4: 365 };
export const VIDEO_PAGE_SUFFIXES = ['', '/viewers', '/engagement'];

export const TAB_LOAD_TIMEOUT_MS = 30_000;
export const POSTS_SCROLL_MAX_ROUNDS = 40;
export const POSTS_SCROLL_STALE_LIMIT = 3;

export const DB_NAME = 'tt-analytics-collector';
export const DB_VERSION = 2;
export const SETTINGS_KEY = 'settings';
export const WALK_STATE_KEY = 'walkState';
export const EXPORT_COUNTER_KEY = 'exportCounter';
export const ENRICHMENT_KEY = 'enrichment';
export const DIAGNOSIS_KEY = 'diagnosis';
/** Suggested export folder, copied for pasting into the Save As dialog. */
/** From WXT_EXPORT_DIR in .env.local; undefined when not set. */
export const EXPORT_DIR = ENV.exportDir;
/** Used only when neither the dashboard setting nor WXT_OPENAI_MODEL is set. */
export const FALLBACK_OPENAI_MODEL = 'gpt-5-mini';
export const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
/** Cap on each raw account insight sent to the LLM, in characters. */
export const LLM_ACCOUNT_INSIGHT_MAX_CHARS = 3000;
export const LLM_CAPTION_MAX_CHARS = 150;
export const COPIED_FEEDBACK_MS = 2000;
export const EXPORT_PICKER_ID = 'tt-export';
export const DASHBOARD_PATH = '/dashboard.html';

export const DEFAULT_SETTINGS: Settings = {
  mode: 'manual',
  passiveCapture: true,
  walkDelayMinMs: 3000,
  walkDelayMaxMs: 6000,
  walkSessionCap: 40,
  walkDateRanges: [7],
  openAiApiKey: '',
  openAiModel: '',
};

export const STATS_REFRESH_MS = 2000;

export const GROWTH_STAGE_PRESETS = [200, 500, 1000];
export const DEFAULT_ENRICHMENT: Enrichment = { growthStage: 200, videoTags: {}, anomalyAnswers: {} };
export const FORMAT_SUGGESTIONS = ['Green screen', 'Talking head', 'Edited explainer', 'Screen recording', 'Slideshow', 'Tutorial'];
export const HOOK_TYPE_SUGGESTIONS = ['Question', 'Bold claim', 'Curiosity gap', 'Shock / surprise', 'Problem → solution', 'Story', 'List / number', 'Visual hook'];

/** Anomaly detection: public videos under this many views are flagged as not distributed. */
export const ANOMALY_LOW_VIEWS = 10;
/** Rates are only compared on videos with at least this many views. */
export const ANOMALY_MIN_VIEWS_FOR_RATES = 50;
/** A value this many times the median is flagged. */
export const ANOMALY_RATIO = 3;
/** Floor for count medians (views, followers) in anomaly checks. */
export const ANOMALY_COUNT_BASE_MIN = 2;
