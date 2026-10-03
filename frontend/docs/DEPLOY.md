# GroupUp Frontend — Deployment Guide

## Environment switching

| Variable | Local development | Preview | Production |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `/api` | `/api` | Real backend API base URL |
| `NEXT_PUBLIC_USE_MOCK_API` | Defaults to `true` in development | `true` or `false` | `false` |
| `NEXT_PUBLIC_SIGNALING_URL` | Unset (mock) | Optional Socket.IO origin | Real backend origin |

In development, the mock API starts automatically unless `NEXT_PUBLIC_USE_MOCK_API=false` is set. The demo seeds a ready-to-use profile, discovery cards, mutual matches, groups and messages. In production, set `NEXT_PUBLIC_USE_MOCK_API=false`; the MSW worker will not start and API requests will go to the configured backend.

## Local demo

```bash
cd frontend
npm ci
npm run dev
```

Visit http://localhost:3000. No database is required for the seeded frontend demo.

## Deploy to Vercel

1. Import the repository into Vercel and select the **Next.js** framework preset.
2. Set `NEXT_PUBLIC_API_URL` to the backend API base URL (including `/api`).
3. Set `NEXT_PUBLIC_USE_MOCK_API=false` for production.
4. Set `NEXT_PUBLIC_SIGNALING_URL` to the backend Socket.IO origin if real-time chat/signaling is enabled.
5. Deploy.

## Mock → real checklist

- [ ] `NEXT_PUBLIC_USE_MOCK_API=false` in production
- [ ] `NEXT_PUBLIC_API_URL` points to the real backend
- [ ] `NEXT_PUBLIC_SIGNALING_URL` points to the backend Socket.IO service
- [ ] MSW shows no "Mocking enabled" message in production
- [ ] `npm run build` completes with zero errors
- [ ] No hardcoded `localhost` references in `lib/api/*`

## Commands

- `npm run dev` — local UI demo, seeded with dummy data
- `npm run build` — production build and type-check gate
- `npm run test:unit` — Vitest
- `npm run test:e2e` — Playwright (install Chromium if needed)
