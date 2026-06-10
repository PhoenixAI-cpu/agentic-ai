from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import numpy as np
from scoring.bayesian import BayesianScorer
from pipelines.chembl import ChEMBLPipeline
from pipelines.uniprot import UniProtPipeline

app = FastAPI(
    title="Antaria Engine",
    description="Bayesian scoring and pipeline orchestration for Antaria drug discovery platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scorer = BayesianScorer()
chembl = ChEMBLPipeline()
uniprot = UniProtPipeline()


class ScoreRequest(BaseModel):
    smiles: str
    target_id: Optional[str] = None
    context: Optional[dict] = None


class ReportRequest(BaseModel):
    candidate_id: str
    include_sections: Optional[list[str]] = None


@app.get("/health")
def health():
    return {"status": "ok", "version": "0.1.0", "engine": "antaria-engine"}


@app.post("/score")
def score_molecule(request: ScoreRequest):
    """
    Score a molecule using the Bayesian ensemble.
    Returns overall confidence score plus per-property breakdown.
    """
    result = scorer.score(
        smiles=request.smiles,
        target_id=request.target_id,
        context=request.context or {},
    )
    return result


@app.post("/report")
def generate_report(request: ReportRequest):
    """
    Generate a structured evidence report for a candidate molecule.
    """
    sections = request.include_sections or [
        "summary", "efficacy", "safety", "admet", "developability", "literature"
    ]
    return {
        "candidate_id": request.candidate_id,
        "status": "stub",
        "message": "Report generation pipeline not yet implemented. Would retrieve: ChEMBL bioactivity data, UniProt target annotations, PubMed literature, and ADMET predictions.",
        "sections_requested": sections,
    }


@app.get("/chembl/compound/{chembl_id}")
def get_chembl_compound(chembl_id: str):
    return chembl.get_compound(chembl_id)


@app.get("/uniprot/target/{uniprot_id}")
def get_uniprot_target(uniprot_id: str):
    return uniprot.get_target(uniprot_id)
