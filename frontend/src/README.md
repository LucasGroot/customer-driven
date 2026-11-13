[Project README](../../README.md) › [Frontend](../README.md) › src

# src

[`main.tsx`](main.tsx) starts the app. Data flows one way: [`api/`](api) fetches, [`hooks/`](hooks) keep it, [`domain/`](domain/README.md) works out what to show, and [`features/`](features/README.md) draw it with [`components/`](components).

The types in [`domain/types.ts`](domain/types.ts) mirror [`backend/src/snapshot/models.py`](../../backend/src/snapshot/models.py). Tests sit next to the code they test, as `*.test.ts` and `*.test.tsx`.

## app

- [`App.tsx`](app/App.tsx) holds which page is open and passes data to it. The page lives in the browser history, so a refresh keeps it.
- [`views.ts`](app/views.ts) lists the pages and their menu entries, and [`Sidebar.tsx`](app/Sidebar.tsx) is the menu.
- [`dashboardTestSupport.tsx`](app/dashboardTestSupport.tsx) is shared by the page tests: it stubs the API with the sample snapshot and opens the dashboard.

The tests here check how every page is built (headings, landmarks, focus) and that it meets WCAG 2.1 AA.

## auth

- [`msalConfig.ts`](auth/msalConfig.ts) sets up Microsoft sign-in from `VITE_ENTRA_TENANT_ID` and `VITE_ENTRA_CLIENT_ID`. Tokens are kept in `sessionStorage`, so closing the tab ends the sign-in.
- [`AuthGate.tsx`](auth/AuthGate.tsx) shows the dashboard only once Microsoft has signed the user in and the API has accepted the token, and [`SignInView.tsx`](auth/SignInView.tsx) until then.
- [`useCurrentUser.ts`](auth/useCurrentUser.ts) asks the API who the user is. The API decides the role, not the token the browser reads.

The app registration this needs is in [docs/entra-app-registration.md](../../docs/entra-app-registration.md). The API side is in [`backend/src/api`](../../backend/src/api/README.md).

## api

Plain functions that call the backend. They take the access token and return data or throw.

| File                                       | Calls                                                                                              |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| [`fetchSnapshot.ts`](api/fetchSnapshot.ts) | `GET /api/snapshot`, see [`snapshot`](../../backend/src/snapshot/README.md)                        |
| [`review.ts`](api/review.ts)               | The review endpoints, see [`review`](../../backend/src/review/README.md)                           |
| [`adminApi.ts`](api/adminApi.ts)           | Upload data and start and follow an analysis run, see [`admin`](../../backend/src/admin/README.md) |

## hooks

State that outlives a page.

| Hook                                                     | What it does                                                                                                                                     |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`useSnapshot.ts`](hooks/useSnapshot.ts)                 | Fetches the snapshot when the dashboard opens and again after a new run                                                                          |
| [`useRoutineReview.ts`](hooks/useRoutineReview.ts)       | HR's decisions: owner, discard, map and undo. Changes show at once and are saved by the backend; if saving fails the stored state is shown again |
| [`useAnalysisRun.ts`](hooks/useAnalysisRun.ts)           | Starts an analysis run and follows it step by step. Only administrators can start one                                                            |
| [`useAnalysisSettings.ts`](hooks/useAnalysisSettings.ts) | How much each factor counts towards the priority                                                                                                 |
| [`usePageFocus.ts`](hooks/usePageFocus.ts)               | Moves focus to the heading on every page change, so screen readers notice it                                                                     |

## components

Small parts shared between pages. They know nothing about the analysis; they get what to show as props.

- **Layout:** `Card`, `PageIntro`, `StatGrid`, `StatCard`
- **Tables and charts:** `DataTable`, `ColumnChart`, `CoverageMeter`, `MeterBar`, `Badge`, `StatusBadge`
- **Inputs:** `Button`, `SearchField`, `SelectField`, `MultiSelectField`, `FilterPill`
- **Help:** `InfoBubble`, the (i) that explains a label, and `AboutLink`, which opens "Om analysen" at one question

Every interactive part has to work with the keyboard and a screen reader; the tests in [`app/`](app) check this for the whole dashboard.

## styles

- [`tokens.css`](styles/tokens.css) defines the colours, spacing and the focus ring as CSS variables. Components use these, never fixed colours.
- [`global.css`](styles/global.css) sets the base styles. The focus ring is defined once here, for every interactive element.
- [`fonts.css`](styles/fonts.css) loads the fonts from `public/fonts`. They are self-hosted on purpose, see [the frontend README](../README.md#things-that-are-easy-to-undo-by-accident).

The tests ([`tokens.test.ts`](styles/tokens.test.ts), [`layout.test.ts`](styles/layout.test.ts)) check the colour contrast and that no focus ring is removed.
