# Antaria Engine (v0)

RDKit-backed Bayesian candidate scoring for the Antaria drug-discovery platform.

## What it does

Computes molecular descriptors with RDKit, then scores each candidate on four
axes — **efficacy**, **safety**, **admet**, **developability** — using an
interpretable Bayesian layer. Each axis is a `Beta(2, 2)` prior updated by
Lipinski/Veber-style desirability rules as weighted pseudo-observations, so
every score decomposes into named rules and yields a 95% credible interval.

## Run locally

### conda (recommended — RDKit via conda-forge)

```bash
conda env create -f environment.yml
conda activate antaria-engine
uvicorn app.main:app --port 8000 --reload   # from apps/engine/
```

### pip (RDKit PyPI wheel)

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload   # from apps/engine/
```

If RDKit cannot be installed, the API still starts: `/health` reports
`"rdkit": false` and scoring endpoints return a clear per-candidate error.

## Endpoints

- `GET  /health` → `{"status":"ok","rdkit":true|false}`
- `GET  /candidates/sample` → built-in sample set, scored and ranked
- `POST /score` → body `{"candidates":[{"id":"AX-7291","smiles":"..."}]}`; returns
  candidates ranked by overall posterior mean, with a per-candidate `error`
  field for unparseable SMILES.
- `POST /report` → stub (Phase 8).

## Deployment (Railway / Render)

Both platforms can build from the included `Dockerfile`, or run the start
command directly:

```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

The web app reaches the engine via `ENGINE_URL`. CORS is open in dev; restrict
`allow_origins` to the web origin before production.

### Docker

```bash
docker build -t antaria-engine .
docker run -p 8000:8000 antaria-engine
```
