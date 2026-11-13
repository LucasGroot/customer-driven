# Git conventions

## Commit messages

Run this once per clone so `git commit` (no `-m`) opens your editor pre-filled with the template below:

```bash
git config commit.template .gitmessage
```

Template (see [.gitmessage](.gitmessage) for the full version with all comments):

- **Title:** `<type>:<subject>`, max 50 characters.
  `type` is one of: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `ci`, `build`, `wip`.
- **Body:** max 72 characters per line — explain *what* changed and *why*.
- Optional: *how* (algorithm/spec name), related issue, `Co-authored-by: Full Name <email@example.com>`.

| type | meaning |
|---|---|
| `feat` | new feature |
| `fix` | bug fix |
| `refactor` | code refactoring |
| `style` | formatting only, no logic change |
| `docs` | documentation update |
| `test` | add or improve tests |
| `ci` | CI configuration |
| `build` | build process or dependency changes |
| `wip` | work in progress |

## Linting and formatting

The frontend uses ESLint for code quality and Prettier for formatting. From `frontend/`:

| command | does |
|---|---|
| `npm run lint` | reports lint errors |
| `npm run lint:fix` | fixes what ESLint can, then formats everything with Prettier |
| `npm run format` | formats everything with Prettier |
| `npm run format:check` | reports unformatted files, as CI does |

The Python code uses Ruff for both. From `backend/`, with the virtual environment active:

| command | does |
|---|---|
| `ruff check .` | reports lint errors |
| `ruff check --fix . && ruff format .` | fixes what Ruff can, then formats everything |
| `ruff format --check .` | reports unformatted files, as CI does |

In VS Code, install the recommended extensions (Prettier, ESLint and Ruff, suggested when you open
the project). Files are then formatted and lint-fixed on every save, using the shared settings in
`.vscode/settings.json`.

## Before a pull request

Run what CI runs, with the virtual environment active. CI runs on every push to `dev` and `main` and on pull requests to `main`, so a pull request to `dev` is not checked until it is merged.

| where | command |
|---|---|
| `backend/` | `python -m pytest` |
| `backend/` | `ruff check .` and `ruff format --check .` |
| `frontend/` | `npx tsc -b` (not `--noEmit`, which checks nothing here) |
| `frontend/` | `npm run lint` and `npm run format:check` |
| `frontend/` | `npx vitest run` |

The database tests need a database whose name contains `test`, see [`backend/tests/`](backend/tests/README.md). New functionality comes with tests, and a folder whose purpose changes gets its README updated, see [Project structure](README.md#project-structure).

## Branch naming

Create the branch from the issue on GitHub, so its name starts with the issue number, then the `type` from the table above and a short description:

`<issue number>-<type>-<description>`, for example `104-feat-run-postgresql-in-docker-compose`.

Branch from `dev` and open the pull request against `dev`. `main` is for releases.
