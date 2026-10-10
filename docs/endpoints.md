# TikTok Studio — Endpoint Map (observed 2026-10-09)

All requests are same-origin `https://www.tiktok.com`, made by the page itself.

## Endpoints to capture
| Endpoint | Method | Purpose |
|---|---|---|
| `/aweme/v2/data/insight/` | GET | Main analytics. `type_requests` = JSON array of `{insigh_type, ...}` (note the TikTok typo "insigh"). One response holds several insight types. |
| `/tiktok/v1/analytics/insights/` | GET | Numeric `insight_type` (82, 126, 91 + `item_id`). Purpose TBD from captured bodies. |
| `/tiktok/creator/manage/item_list/v1/` | POST | Video list (Posts page), paginated on scroll. Source of all video IDs. |
| `/tiktokstudio/api/web/user` | GET | Account/profile. |
| `/tiktok/v1/creator/ai_comment/analytics_overview` | POST | Comment analytics per item. |

## Pages → insight types
- **Account overview** `/tiktokstudio/analytics/overview`: `vv_history`, `pv_history`, `like_history`, `comment_history`, `share_history`, `follower_num_history`, `reached_audience_history` (`days`, `end_days`), `vv_traffic_source`, `user_search_terms`, `unique_viewer_num`, `follower_num`.
- **Account content** `/tiktokstudio/analytics/content`: `top_items`.
- **Account viewers / followers**: `/tiktokstudio/analytics/viewers`, `/tiktokstudio/analytics/followers`.
- **Video overview** `/tiktokstudio/analytics/{id}`: `video_info`, `item_search_terms`, `video_traffic_source_percent_realtime`, `video_retention_rate_realtime`, `video_view_realtime`, `video_total_duration_realtime`, `video_per_duration_realtime`, `video_finish_rate_realtime`, `video_new_follower_realtime`, `video_new_followers`, `video_vv_history_7d`, `video_vv_history_48_hours`, `photo_*`.
- **Video viewers** `/tiktokstudio/analytics/{id}/viewers`: `video_uv`, `video_uv_before`, new/returning %, follower/non-follower %, age, gender, location.
- **Video engagement** `/tiktokstudio/analytics/{id}/engagement`: `video_like_distribution_realtime`, `photo_like_distribution_7d`.
- **Posts list** `/tiktokstudio/content`: `item_list` (scroll for more).

## Notes
- The time range is chosen in-page (default "Last 7 days"). Guided walk captures the default; other ranges are captured in Passive mode when the user switches them.
- Signed params (`X-Bogus`, `msToken`, `X-Gnarly`) appear on some calls, confirming we must never replay requests.
- Response body shapes: to be confirmed from the first real captures (organizer step).

## Date ranges
- Account pages take `?dateRange={"type":"fixed","pastDay":N}` (N = 7, 28, 60, 365). Loading the URL is the same as picking the range in Studio.
- Requests then carry `range` codes: 1 = 7, 2 = 28, 3 = 60, 4 = 365 days (verified). History types use `days` + `end_days` instead.
