# TikTok Analytics AI

A Chrome extension that collects your full TikTok Studio analytics and uses AI to diagnose what's holding your growth back, then tells you what to do next.

Built for creators stuck at a view ceiling (e.g. videos stalling around 200 views) who want to know *why*: weak hooks, wrong length, bad posting times, or the wrong format.

## What it does

1. **Captures** every analytics number TikTok Studio shows: per video (views, likes, comments, shares, saves, retention curve, average watch time, completion rate, traffic sources, new followers) and account-wide (overview, viewers, followers, content) across 7/28/60/365-day ranges.
2. **Organizes** it automatically into one clean structure: hook retention at 2s/3s, the biggest drop-off second, engagement rates, and the time window of every number. Private videos are detected and left out of comparisons.
3. **Tags videos automatically**: AI reads each video's cover image and caption to tag its format, hook type and on-screen hook text. You can check a short list of key videos and optionally correct any other.
4. **Lets you add context** (optional): your growth stage and explanations for unusual numbers (friends shared it, a promotion, accidental likes) so the analysis isn't skewed.
5. **Diagnoses with AI** (OpenAI, your own key): what works, what doesn't, the likely causes (hook first), and concrete next steps for your growth stage. Then chat with it to clarify anything.
6. **Exports** everything as a single JSON file (optional backup; the app itself reads from the extension's local storage).

## Safe by design

- **No bot behavior.** The extension never sends requests to TikTok. It only reads the responses TikTok Studio's own page loads while you browse (or while it opens pages for you in Automatic mode, with randomized pauses and a session cap).
- **No login handling.** It uses your existing logged-in session.
- **Local only.** All data stays in your browser. The only outbound request is the OpenAI call you trigger.

## Install

Requirements: Node.js 18+ and Chrome (or Edge/Brave).

```bash
git clone https://github.com/Azizjhnsn/tiktok-analytics-ai.git
cd tiktok-analytics-ai
npm install
cp .env.example .env.local   # then fill it in (see below)
npm run build
```

Load it in Chrome: `chrome://extensions` → enable **Developer mode** → **Load unpacked** → select `.output/chrome-mv3/`.

### Configuration (`.env.local`)

| Variable | Purpose |
|---|---|
| `WXT_OPENAI_API_KEY` | Your OpenAI API key, used for auto-tagging and the diagnosis. |
| `WXT_OPENAI_MODEL` | Model to use. Defaults to `gpt-5-mini` (must accept images for auto-tagging). |

`.env.local` is git-ignored. Values are baked in at build time, so rebuild after changing them, and don't share your `.output/` folder.

## Usage

1. Open [TikTok Studio](https://www.tiktok.com/tiktokstudio) while logged in.
2. Open the extension popup and choose a mode:
   - **Manual:** browse your analytics pages; everything they load is captured.
   - **Automatic:** pick the account date ranges, then **Start walk**. It opens your posts list, account pages and each video's analytics pages one by one, with random pauses and a per-session video limit. Stop and resume any time.
3. Click **Open dashboard** to:
   - set your growth stage (200 / 500 / 1000 / custom views),
   - review flagged anomalies and tag your videos (optional),
   - **Run diagnosis** for AI analysis and next steps, then **ask follow-up questions** in the chat below it,
   - **⬇ Download** (top right) to save the full dataset as JSON to your Downloads folder.

## Tech stack

[WXT](https://wxt.dev) (Manifest V3) · TypeScript · React · IndexedDB.

```
src/
  entrypoints/   background, content scripts, popup, dashboard
  controllers/   message handlers
  services/      capture, guided walk, organizer, anomalies, analysis, LLM, export
  utils/         pure helpers
  components/    shared UI
```

Scripts: `npm run dev` (hot reload), `npm run build`, `npm run compile` (type-check).

## Disclaimer

Not affiliated with or endorsed by TikTok. Use it with your own account and in line with TikTok's terms. AI advice is a starting point, not a guarantee.

## License

[Apache 2.0](LICENSE)
