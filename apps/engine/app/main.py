"""Antaria Engine — FastAPI app for RDKit Bayesian candidate scoring."""

import asyncio
from datetime import datetime, timezone
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .data.sample_candidates import SAMPLE_CANDIDATES
from .scoring import bayesian
from .scoring.descriptors import rdkit_available
from .pipelines.chembl import ChEMBLPipeline
from .pipelines.uniprot import UniProtPipeline
from .pipelines.opentargets import OpenTargetsPipeline
from .pipelines.clinicaltrials import ClinicalTrialsPipeline

app = FastAPI(
    title="Antaria Engine",
    description="RDKit-backed Bayesian scoring for the Antaria drug-discovery platform",
    version="0.3.0",
)

# Dev CORS: allow all origins. TODO: restrict to the web app origin in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

chembl = ChEMBLPipeline()
uniprot = UniProtPipeline()
opentargets = OpenTargetsPipeline()
clinicaltrials = ClinicalTrialsPipeline()


# ---- Pydantic models -------------------------------------------------------

class CandidateInput(BaseModel):
    id: str
    smiles: str
    name: Optional[str] = None
    stage: Optional[str] = None


class ScoreRequest(BaseModel):
    candidates: list[CandidateInput]


class ReportRequest(BaseModel):
    candidate_id: str
    include_sections: Optional[list[str]] = None


class OpenTargetsDiseasesRequest(BaseModel):
    ensembl_id: str
    limit: int = 10


class OpenTargetsSearchRequest(BaseModel):
    query: str
    limit: int = 5


# ---- Helpers ---------------------------------------------------------------

def _now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def _meta(source: str, cache_hit: bool = False) -> dict:
    return {"source": source, "retrieved_at": _now_utc(), "cache_hit": cache_hit}


def _score_one(cand: dict) -> dict:
    """Score one candidate dict; attach metadata or a per-candidate error field."""
    base = {
        "id": cand.get("id"),
        "name": cand.get("name") or cand.get("id"),
        "stage": cand.get("stage"),
        "smiles": cand.get("smiles"),
    }
    try:
        result = bayesian.score_candidate(cand["smiles"]).to_dict()
        base.update(result)
        base["error"] = None
    except Exception as exc:  # ValueError (bad SMILES) or RuntimeError (no RDKit)
        base["error"] = str(exc)
        base["overall"] = None
    return base


def _score_and_rank(candidates: list[dict]) -> list[dict]:
    scored = [_score_one(c) for c in candidates]
    scored.sort(
        key=lambda r: r["overall"]["mean"] if r.get("overall") else -1.0,
        reverse=True,
    )
    return scored


async def _try_chembl_data(name: str) -> Optional[dict]:
    """Best-effort: search ChEMBL for a compound by name, return summary with 3s timeout."""
    try:
        results = await asyncio.wait_for(chembl.search_compounds(name, limit=1), timeout=3.0)
        if results:
            c = results[0]
            return {
                "id": c.get("chembl_id"),
                "mw": c.get("molecular_weight"),
                "logp": c.get("alogp"),
                "ro5_violations": c.get("ro5_violations"),
            }
    except Exception:
        pass
    return None


# ---- Core endpoints --------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "version": "0.3.0", "rdkit": rdkit_available()}


@app.post("/score")
def score(request: ScoreRequest):
    """Score and rank candidates by overall posterior mean (descending)."""
    return {"candidates": _score_and_rank([c.model_dump() for c in request.candidates])}


@app.get("/candidates/sample")
async def candidates_sample():
    """Return the built-in sample set, scored and ranked, with optional ChEMBL enrichment."""
    scored = _score_and_rank([dict(c) for c in SAMPLE_CANDIDATES])
    # Enrich with ChEMBL data (best-effort, 3s timeout each)
    for cand in scored:
        name = cand.get("name") or cand.get("id", "")
        chembl_data = await _try_chembl_data(name)
        cand["chembl_data"] = chembl_data
    return {"candidates": scored}


@app.post("/report")
def generate_report(request: ReportRequest):
    """Structured evidence report — stub, to be implemented in Phase 8."""
    sections = request.include_sections or [
        "summary", "efficacy", "safety", "admet", "developability", "literature"
    ]
    return {
        "candidate_id": request.candidate_id,
        "status": "stub",
        "message": "Report generation arrives in Phase 8 (ChEMBL/UniProt/PubMed evidence).",
        "sections_requested": sections,
    }


# ---- Legacy endpoints (kept for backward compatibility) --------------------

@app.get("/chembl/compound/{chembl_id}")
async def get_chembl_compound_legacy(chembl_id: str):
    return await chembl.get_compound(chembl_id)


@app.get("/uniprot/target/{uniprot_id}")
async def get_uniprot_target_legacy(uniprot_id: str):
    return await uniprot.get_protein(uniprot_id)


# ---- Pipeline endpoints ----------------------------------------------------

@app.get("/pipelines/chembl/compound/{chembl_id}")
async def pipeline_chembl_compound(chembl_id: str):
    """Fetch ChEMBL compound data."""
    if not chembl_id.strip():
        raise HTTPException(status_code=400, detail="chembl_id is required")
    data = await chembl.get_compound(chembl_id.upper())
    cache_hit = data.pop("_cache_hit", False)
    return {"data": data, "_meta": _meta("ChEMBL", cache_hit)}


@app.get("/pipelines/chembl/search")
async def pipeline_chembl_search(q: str = Query(..., min_length=1)):
    """Search ChEMBL compounds by name."""
    results = await chembl.search_compounds(q)
    return {"data": results, "_meta": _meta("ChEMBL")}


@app.get("/pipelines/uniprot/protein/{uniprot_id}")
async def pipeline_uniprot_protein(uniprot_id: str):
    """Fetch UniProt protein entry."""
    if not uniprot_id.strip():
        raise HTTPException(status_code=400, detail="uniprot_id is required")
    data = await uniprot.get_protein(uniprot_id.upper())
    cache_hit = data.pop("_cache_hit", False)
    return {"data": data, "_meta": _meta("UniProt", cache_hit)}


@app.get("/pipelines/uniprot/search")
async def pipeline_uniprot_search(q: str = Query(..., min_length=1)):
    """Search UniProt proteins by name/gene."""
    results = await uniprot.search_proteins(q)
    return {"data": results, "_meta": _meta("UniProt")}


@app.post("/pipelines/opentargets/target-diseases")
async def pipeline_opentargets_diseases(request: OpenTargetsDiseasesRequest):
    """Get disease associations for an Ensembl target ID."""
    if not request.ensembl_id.strip():
        raise HTTPException(status_code=400, detail="ensembl_id is required")
    results = await opentargets.get_target_diseases(request.ensembl_id, request.limit)
    return {"data": results, "_meta": _meta("Open Targets")}


@app.post("/pipelines/opentargets/search")
async def pipeline_opentargets_search(request: OpenTargetsSearchRequest):
    """Search Open Targets for gene targets."""
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="query is required")
    results = await opentargets.search_targets(request.query, request.limit)
    return {"data": results, "_meta": _meta("Open Targets")}


@app.get("/pipelines/trials/search")
async def pipeline_trials_search(
    q: str = Query(..., min_length=1),
    status: str = Query("RECRUITING"),
):
    """Search ClinicalTrials.gov for trials."""
    results = await clinicaltrials.search_trials(q, status=status)
    return {"data": results, "_meta": _meta("ClinicalTrials.gov")}


@app.get("/pipelines/trials/failures")
async def pipeline_trials_failures(
    indication: str = Query(..., min_length=1),
    phase: str = Query("PHASE2"),
):
    """Get terminated/completed trials for failure pattern analysis."""
    results = await clinicaltrials.get_failure_patterns(indication, phase=phase)
    return {"data": results, "_meta": _meta("ClinicalTrials.gov")}
