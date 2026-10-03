# GroupUp

GroupUp helps university students meet compatible roommates, form a circle and start the conversations that make a shared home work.

## Run the local demo

```bash
cd frontend
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The frontend starts in demo mode with seeded profiles, photos, mutual matches, groups and chat messages. No backend, database, API credentials or remote image host is needed to try the app flow.

The app opens in a ready-to-explore session as Jordan. You can also sign out and choose **Explore the demo as Jordan** on the sign-in screen. Local verification displays the demo code `GROUPUP26` in the UI. Demo changes are held in memory and reset when the page reloads.

In development, the local demo adapter is enabled automatically. To choose explicitly, set `NEXT_PUBLIC_USE_MOCK_API=true`. To connect to a backend later, set `NEXT_PUBLIC_USE_MOCK_API=false` and set `NEXT_PUBLIC_API_URL` to the API base URL before starting Next.js.

## Checks

```bash
npm run lint
npm run test:unit
npm run test:e2e
npm run build
```

Playwright browser binaries may need to be installed once with `npx playwright install chromium` before running end-to-end tests.
