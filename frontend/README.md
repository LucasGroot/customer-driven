[Project README](../README.md) › Frontend

# Frontend

The dashboard, in React, TypeScript and Vite. The interface is in Norwegian because the users are HR staff at Trondheim kommune; the code is in English. It shows which routines have the most unanswered questions, the questions HR has to place by hand, and what HR decided.

The code is in [`src/`](src/README.md). The data it shows comes from the API in [`backend/src`](../backend/README.md): the snapshot from `/api/snapshot`, and HR's decisions from `/api/review`. The sign-in is Microsoft Entra, set up as described in [docs/entra-app-registration.md](../docs/entra-app-registration.md).

## Running it

Requires Node.js 22.12 or newer. The API has to be running, because the dashboard asks it who you are. From `frontend/`:

```bash
npm install     # once, and again after dependencies change
npm run dev     # open http://localhost:5173
```

The dev server forwards `/api` to the API on port 8000. It reads the Entra IDs `VITE_ENTRA_TENANT_ID` and `VITE_ENTRA_CLIENT_ID` from the root `.env`. To run everything in containers, see [Running with Docker](../README.md#running-with-docker).

## Commands

| Command                             | Does                                                          |
| ----------------------------------- | ------------------------------------------------------------- |
| `npm run dev`                       | Starts the dev server                                         |
| `npm run build`                     | Type-checks and builds to `dist/`                             |
| `npm test`                          | Runs the tests in watch mode. `npx vitest run` runs them once |
| `npm run typecheck`                 | Type-checks (`tsc -b`)                                        |
| `npm run lint` / `npm run lint:fix` | ESLint, and ESLint plus Prettier with fixes                   |
| `npm run format:check`              | Reports files that Prettier would change                      |

CI runs the type check, lint, format check and tests, see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Things that are easy to undo by accident

- The fonts are self-hosted in `public/fonts`. Do not replace them with a Google Fonts link: it would send visitors' IP addresses to Google, which a municipality should not do, and it would loosen the CSP.
- [`vite.config.ts`](vite.config.ts) and [`nginx.conf`](nginx.conf) carry the security headers. In production the CSP has to be sent as a real response header, because `frame-ancestors` is ignored in a `<meta>` tag. The Docker image does this with nginx.
- The Entra IDs are built into the JavaScript, so the image has to be built again when they change.

The `Dockerfile` builds the dashboard and serves it with nginx, see [Running with Docker](../README.md#running-with-docker).
