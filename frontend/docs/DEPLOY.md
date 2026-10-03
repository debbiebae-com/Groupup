# GroupUp Frontend — Deployment Guide

## Environment switching

| Variable | Local development | Preview | Production |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `/api` (unused in local demo mode) | `/api` or backend API base URL | Real backend API base URL |
| `NEXT_PUBLIC_USE_MOCK_API` | Defaults to `true` in development | `true` or `false` | `false` |
| `NEXT_PUBLIC_SIGNALING_URL` | Unset (local demo) | Optional Socket.IO origin | Real backend origin |

The local demo uses an in-memory adapter in the browser. In development, it is enabled automatically unless `NEXT_PUBLIC_USE_MOCK_API=false` is set; no backend, database, API credentials, or image host is required. Seeded data includes the demo student, 12 discovery profiles, matches, groups and chat messages. All demo photos are bundled under `public/images/demo/`.

Setting `NEXT_PUBLIC_USE_MOCK_API=false` routes API requests to `NEXT_PUBLIC_API_URL` and enables the real Socket.IO client when `NEXT_PUBLIC_SIGNALING_URL` is configured. Configure these before starting or building Next.js.

## Local demo

```bash
cd frontend
npm ci
npm run dev
```

Visit http://localhost:3000. The app opens in an authenticated demo session. **Explore the demo as Jordan** also explicitly switches to the local adapter, even when backend mode is configured; that override lasts until you sign out. For the local verification flow, use the code shown in the UI (`GROUPUP26`). Demo mutations are kept in memory and reset when the page reloads.

## Deploy to Vercel

1. Import the repository into Vercel and select the **Next.js** framework preset.
2. Set `NEXT_PUBLIC_API_URL` to the backend API base URL (including `/api`).
3. Set `NEXT_PUBLIC_USE_MOCK_API=false` for production.
4. Set `NEXT_PUBLIC_SIGNALING_URL` to the backend Socket.IO origin if real-time chat/signaling is enabled.
5. Deploy.

## Mock → real checklist

- [ ] `NEXT_PUBLIC_USE_MOCK_API=false` in production
- [ ] `NEXT_PUBLIC_API_URL` points to the real backend
- [ ] `NEXT_PUBLIC_SIGNALING_URL` points to the backend Socket.IO service (if enabled)
- [ ] Production API, authentication and CORS settings are configured in the backend
- [ ] `npm run build` completes with zero errors
- [ ] No hardcoded `localhost` references in browser-facing API code

## Commands

- `npm run dev` — local UI demo, seeded with dummy data
- `npm run build` — production build and type-check gate
- `npm run test:unit` — Vitest
- `npm run test:e2e` — Playwright (install Chromium if needed)
