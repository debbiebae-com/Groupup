# GroupUp

GroupUp helps university students meet compatible roommates, form a circle and start the conversations that make a shared home work.

## Run the local demo

```bash
cd frontend
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). In development, the app starts its mock API automatically and loads seeded demo profiles, mutual matches, groups and chat messages. No database or API credentials are needed to explore the UI.

The app opens in a ready-to-explore demo session. You can also sign out and use **Explore the demo as Jordan** on the sign-in screen. The local verification flow displays its demo code in the UI.

To explicitly choose mock mode, set `NEXT_PUBLIC_USE_MOCK_API=true`. To connect the frontend to a running backend instead, set `NEXT_PUBLIC_USE_MOCK_API=false` and `NEXT_PUBLIC_API_URL` to the backend API base URL, then restart Next.js.

## Checks

```bash
npm run lint
npm run test:unit
npm run test:e2e
npm run build
```

Playwright browser binaries may need to be installed once with `npx playwright install chromium` before running end-to-end tests.
