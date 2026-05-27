# Sirhaana Backend — Claude Code Context

NestJS + Fastify + MySQL + Redis backend for an AI inventory/image-processing pipeline.
This file is read automatically every session. Keep it accurate.

## Stack
- **Framework:** NestJS with the **Fastify** adapter (NOT Express — this matters, see CORS/uploads below)
- **DB:** MySQL via TypeORM. Connection in `.env` (DB_HOST/PORT/USER/PASSWORD/NAME)
- **Cache:** Redis (used by fastify-rate-limit)
- **Runs on:** http://localhost:3000  (APP_PORT in .env)
- **Frontend** is a SEPARATE repo (Next.js) running on http://localhost:3001
- **AI:** Google Gemini via @langchain/google-genai

## How to run
```
npm run start:dev      # hot-reload via nest start --watch
npm run cli -- help    # list CLI seed commands
```
Health check: `GET http://localhost:3000/health` → {"success":true,"data":{"status":"ok"}}

## CRITICAL GOTCHAS (learned the hard way — do not relearn these)

### CORS (Fastify, not Express)
- Use **@fastify/cors** registered via `app.register(...)`, NOT NestJS `app.enableCors()`.
  enableCors does not reliably attach headers under Fastify here.
- Register CORS **BEFORE** helmet.
- Helmet must set `crossOriginResourcePolicy: { policy: 'cross-origin' }` or the
  browser blocks responses even when headers are present.
- `origin: ['*']` + `credentials: true` is INVALID and browsers reject it. Use the
  explicit origin `http://localhost:3001`.
- Verify with: curl -Method POST <url> -Headers @{ "Origin" = "http://localhost:3001" }
  and confirm `access-control-allow-origin` is in the response headers.

### File uploads (Fastify content-type parser)
- Fastify rejects non-JSON bodies with 415 by default. The media upload PUT endpoint
  needs `addContentTypeParser` for image/* (and application/octet-stream) with
  `{ parseAs: 'buffer' }` in main.ts BEFORE the app starts listening.
- The browser/client MUST send `Content-Type: image/jpeg` (or appropriate) on the PUT,
  otherwise the parser doesn't match → 415.
- After any upload change, VERIFY the saved file size > 0 (a past bug saved 0-byte files).
  Check: `Get-ChildItem ./uploads | Select Name, Length`

### Auth (demo mode)
- `@Allow([...])` decorators apply the JWT guard. For the local demo these are
  commented out on media + AI + inventory controllers.
- There is NO login flow wired up. Do not assume `req.user` exists.
- The AI/inventory services use **demo fallbacks**: getOrCreateDemoVendor /
  getOrCreateDemoBrand instead of looking up the authenticated user.
- ⚠️ These demo fallbacks are a stopgap. The real fix is a proper auth model.
  Do NOT keep hardcoding demo entities as a way to dodge auth errors — flag it instead.

### Seed data (must exist or the pipeline 500s)
Run these in order on a fresh DB:
```
npm run cli -- init:roles
npm run cli -- init:super-admin
npm run cli -- init:prompts
```
Categories, the demo brand, and some schema columns (e.g. `stock`) were historically
missing and are seeded via temporary HTTP endpoints under /v1/seed/*. There is a
consolidated seed script — prefer that over the ad-hoc endpoints (see scripts/).

### Gemini API (the big time-sink)
- Free tier is brutally limited: **gemini-2.5-flash text = 20 requests/DAY/project**,
  and image-generation models have an even smaller daily cap.
- **MOCK the image-generation step during all development.** Only call the real image
  API for a final end-to-end validation, once everything else is green.
- Every FAILED pipeline run still consumes quota. Never debug unrelated code with a
  live Gemini call in the loop.
- Model env vars: GEMINI_MODEL_TEXT, GEMINI_MODEL_NANO_BANANA (image model).
- Prompt `lifestyle-image-variations` controls how many image calls per run — keep it
  at 1 variation for local testing (4 = 4x the quota burn).
- Gemini JSON output is sometimes truncated/malformed → always parse defensively with
  a try/catch fallback, and set a generous maxOutputTokens.

### Response envelope
- A global ResponseInterceptor wraps EVERYTHING in `{ success: true, data: ... }`.
- List endpoints therefore double-nest: `{ success, data: { data: [...], meta } }`.
- The frontend API client must unwrap accordingly. A real bug: BrandTab read `.data`
  once instead of twice and silently showed empty.

## The AI pipeline flow (so you know what "done" means)
1. POST /v1/media/urls → returns { key, url } (url is now a local backend upload URL)
2. PUT <url> with the image bytes → saved to ./uploads (verify size > 0)
3. POST /v1/ai/process-inventory with { imageKeys, commerceCategory, supportingText }
4. Backend: group images (Gemini text) → [MOCK image gen] → generate title/desc (Gemini
   text) → save Inventory row with generationStatus
5. Frontend polls GET /v1/inventory until generationStatus === "Image Generation Complete"

## Before declaring a task done
- [ ] Backend compiles (watch the `npm run start:dev` terminal for webpack success)
- [ ] Relevant endpoint tested with curl, real response inspected (not assumed)
- [ ] Uploads verified > 0 bytes if upload was touched
- [ ] No live Gemini call burned on unrelated debugging
- [ ] Changes committed to git so they can be rolled back
