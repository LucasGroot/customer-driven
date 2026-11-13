[Project README](../README.md) › Data

# Data

The real data is confidential HR data and is **not in git**. `*.pdf`, `*.xlsx`, `*.zip`, `*.pkl`, `*.csv` and everything in `raw/` and `processed/` are gitignored on purpose. Never commit them, and never paste them into a chat or send them to an external service.

- [`raw/`](raw/README.md): the data from the customer.
- [`processed/`](processed/README.md): what the analysis writes to disk.

An admin normally puts the data here through the dashboard's "Importer data" page ([`admin`](../backend/src/admin/README.md)). Without any data the dashboard runs on a sample of invented data, and you can make your own small test files to run a whole analysis, see [The data](../README.md#the-data) in the project README. In Docker, these folders are volumes, see [Running with Docker](../README.md#running-with-docker).
