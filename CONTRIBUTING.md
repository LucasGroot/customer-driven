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

## Branch naming

Based on [conventionalbranch.org](https://conventionalbranch.org/):

| prefix | for | example |
|---|---|---|
| `feat/` | new features | `feat/extract-data` |
| `fix/` | bug fixes | `bugfix/fix-reading-pdf` |
| `hotfix/` | urgent fixes | `hotfix/security-pages` |
| `release/` | release prep | `release/v1.1` |
| `chore/` | non-code tasks | `chore/update-dependency` |