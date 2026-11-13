[Project README](../../../README.md) › [Frontend](../../README.md) › [src](../README.md) › domain

# domain

The rules and numbers, as plain functions with no React in them, so they can be tested and argued about in one place.

| File                               | What it holds                                                                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| [`types.ts`](types.ts)             | The shapes of a snapshot and of HR's decisions. Mirrors [`models.py`](../../../backend/src/snapshot/models.py) in the backend |
| [`routines.ts`](routines.ts)       | Which questions belong to which routine once HR's decisions are applied, and each routine's mean coverage                     |
| [`priority.ts`](priority.ts)       | The priority score of a routine and the three coverage levels (Svak, Delvis, God)                                             |
| [`labels.ts`](labels.ts)           | The Norwegian wording of the values the domain produces                                                                       |
| [`owners.ts`](owners.ts)           | Who a routine can be given to                                                                                                 |
| [`aboutTopics.ts`](aboutTopics.ts) | The questions on "Om analysen" that other pages link to                                                                       |

## How the numbers are made

- **Coverage** of a question is how well it matches its best routine (from the analysis). A routine's coverage is the mean over the questions placed on it.
- **Priority** is the mean of two factors, each the percentile rank of a routine among the routines that have questions: how many questions it has, and how poorly it covers them (`1 − coverage`). They count equally by default. Rank 1 is the highest priority.
- **Coverage levels** divide the questions that sit on a routine into three groups of roughly equal size. The limits are `PARTIAL_COVERAGE_FROM` and `GOOD_COVERAGE_FROM` in [`priority.ts`](priority.ts), and they are relative, not a judgement of quality.
- A question whose best match is too weak is not placed on a routine. It is sent to HR for manual review, see `MIN_RELEVANCE` in [`build_snapshot.py`](../../../backend/src/snapshot/build_snapshot.py).

The same explanation, in Norwegian, is on the "Om analysen" page ([`features/about`](../features/README.md)).
