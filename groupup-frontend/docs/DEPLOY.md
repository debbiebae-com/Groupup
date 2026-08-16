# GroupUp Frontend — Deployment Guide

## Environment Switching

| Variable | Dev (mock) | Preview (mock) | Production (real) |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `/api` | `/api` | `https://groupup-backend-api.com` |
| `NEXT_PUBLIC_USE_MOCK_API` | `true` | `true` | `false` |
| `USE_MOCK_API` | `true` | `true` | `false` |

MSW only initializes when `NODE_ENV === "development"` **or**
`NEXT_PUBLIC_USE_MOCK_API === "true"`. In production (`false`) the worker never
starts, and all `/api/*` calls hit the real backend.

## Deploy to Vercel

1. Push this repo to GitHub/GitLab.
2. Import the repo at https://vercel.com/new.
3. Framework preset: **Next.js** (auto-detected).
4. Set environment variables in Project → Settings → Environment Variables:
   - `NEXT_PUBLIC_API_URL` (production: real backend URL)
   - `NEXT_PUBLIC_USE_MOCK_API=false` (production) / `true` (preview)
5. Deploy.

## Mock → Real Checklist

- [ ] `NEXT_PUBLIC_USE_MOCK_API=false` in production
- [ ] `NEXT_PUBLIC_API_URL` points to the real backend
- [ ] MSW shows **no** "[MSW] Mocking enabled." in production console
- [ ] `npm run build` completes with zero errors
- [ ] No hardcoded `localhost` references in `lib/api/*`

## Commands

- `npm run dev` — local dev (MSW on)
- `npm run build` — production build (type-check gate)
- `npm run test:unit` — Vitest
- `npm run test:e2e` — Playwright