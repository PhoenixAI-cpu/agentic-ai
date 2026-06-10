"""Antaria Engine — FastAPI app for RDKit Bayesian candidate scoring."""

from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .data.sample_candidates import SAMPLE_CANDIDATES
from .scoring import bayesian
from .scoring.descriptors import rdkit_available
from .pipelines.chembl import ChEMBLPipeline
from .pipelines.uniprot import UniProtPipeline

app = FastAPI(
    title="Antaria Engine",
    description="RDKit-backed Bayesian scoring for the Antaria drug-discovery platform",
    version="0.2.0",
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


# ---- Helpers ---------------------------------------------------------------

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


# ---- Endpoints -------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "version": "0.2.0", "rdkit": rdkit_available()}


@app.post("/score")
def score(request: ScoreRequest):
    """Score and rank candidates by overall posterior mean (descending)."""
    return {"candidates": _score_and_rank([c.model_dump() for c in request.candidates])}


@app.get("/candidates/sample")
def candidates_sample():
    """Return the built-in sample set, scored and ranked."""
    return {"candidates": _score_and_rank([dict(c) for c in SAMPLE_CANDIDATES])}


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


@app.get("/chembl/compound/{chembl_id}")
def get_chembl_compound(chembl_id: str):
    return chembl.get_compound(chembl_id)


@app.get("/uniprot/target/{uniprot_id}")
def get_uniprot_target(uniprot_id: str):
    return uniprot.get_target(uniprot_id)
