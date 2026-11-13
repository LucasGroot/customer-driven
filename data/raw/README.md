[Project README](../../README.md) › [Data](../README.md) › raw

# raw

The data from the customer. It is not in git.

| Path | What |
|---|---|
| `serviceNow/serviceNow_questions.xlsx` | The export of ServiceNow questions. A new upload replaces it |
| `kvaliteket/` | The routine PDFs from Kvaliteket, named by document code, for example `1760-1-Vernerunde.pdf`. A new upload adds the routines that are not here yet |
| `ground_truth.csv` | A small hand-made table of which routines answer which questions. Only the evaluation scripts use it, see [`evaluation`](../../backend/src/ai/README.md#evaluation) |

The admin pages write the first two here ([`admin/uploads.py`](../../backend/src/admin/uploads.py)).
