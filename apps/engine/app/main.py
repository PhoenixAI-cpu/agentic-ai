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


# ---- Report helpers (Phase 8) ---------------------------------------------

_SAMPLE_BY_ID = {c["id"]: c for c in SAMPLE_CANDIDATES}
_FLAG_THRESHOLD = 0.55
_DESCRIPTOR_THRESHOLDS = {
    "logp": ("logP", 3.5, "exceeds recommended threshold of 3.5, increasing lipophilicity-related toxicity risk"),
    "molecular_weight": ("molecular weight", 450, "exceeds 450 Da, raising metabolic burden and promiscuity concerns"),
    "tpsa": ("TPSA", 140, "exceeds 140 A, predicting poor oral bioavailability"),
    "rotatable_bonds": ("rotatable bonds", 10, "exceeds 10, reducing oral bioavailability per Veber rules"),
    "hbd": ("H-bond donors", 5, "exceeds 5, impairing membrane permeability per Lipinski rules"),
    "hba": ("H-bond acceptors", 10, "exceeds 10, reducing passive permeability"),
}


def _fmt_score(mean: float, ci_low: float, ci_high: float) -> str:
    return f"{mean:.2f} (95% CI {ci_low:.2f}-{ci_high:.2f})"


def _build_report(
    project_name: str,
    candidates_ids: list,
    indication: str,
    stage: str,
    include_sections: list,
) -> dict:
    """Build a full Decision Intelligence report dict from scores."""
    scored_list = []
    for cid in candidates_ids:
        cand = _SAMPLE_BY_ID.get(cid)
        if cand is None:
            cand = next((c for c in SAMPLE_CANDIDATES if cid.lower() in c["id"].lower()), None)
        if cand is None:
            scored_list.append({
                "id": cid, "name": cid, "stage": stage,
                "smiles": None, "overall": None,
                "error": f"Candidate {cid} not found in sample set",
            })
            continue
        scored_list.append(_score_one(cand))

    scored_list.sort(
        key=lambda r: r["overall"]["mean"] if r.get("overall") else -1.0,
        reverse=True,
    )

    sections = {}

    if "executive_summary" in include_sections:
        top = next((r for r in scored_list if r.get("overall")), None)
        if top:
            ov = top["overall"]
            top_conf = top.get("confidence_label", "Low")
            score_str = _fmt_score(ov["mean"], ov["ci_low"], ov["ci_high"])
            desc = top.get("descriptors", {})
            if desc.get("molecular_weight", 0) > 450:
                trade_off = "Lead optimisation to reduce molecular weight whilst preserving target binding is recommended."
            elif desc.get("logp", 0) > 3.5:
                trade_off = "Reduction of logP to below 3.5 is recommended to mitigate lipophilicity-related risks."
            else:
                trade_off = "The property profile is broadly favourable; further optimisation should focus on increasing confidence by tightening the credible interval."
            flag_note = ""
            if top.get("properties", {}).get("admet", {}).get("mean", 1.0) < _FLAG_THRESHOLD:
                flag_note = " but carries an elevated ADMET flag"
            elif top.get("properties", {}).get("safety", {}).get("mean", 1.0) < _FLAG_THRESHOLD:
                flag_note = " but carries an elevated safety flag"
            sections["executive_summary"] = (
                f"{top['name']} scores highest overall ({score_str}){flag_note}. "
                f"It leads the {len(scored_list)}-candidate set for the {indication} indication "
                f"at the {stage} stage with {top_conf.lower()} model confidence. "
                f"{trade_off}"
            )
        else:
            sections["executive_summary"] = "No valid candidates could be scored for this report."

    if "candidate_ranking" in include_sections:
        ranking = []
        for r in scored_list:
            if not r.get("overall"):
                ranking.append({"id": r["id"], "name": r["name"], "error": r.get("error"), "rationale": "Could not be scored."})
                continue
            ov = r["overall"]
            props = r.get("properties", {})
            prop_means = {k: props[k]["mean"] for k in ("efficacy", "safety", "admet", "developability") if k in props}
            if prop_means:
                best = max(prop_means, key=prop_means.get)
                worst = min(prop_means, key=prop_means.get)
                rationale = (f"Strongest axis is {best} ({prop_means[best]:.2f}); lowest axis is {worst} ({prop_means[worst]:.2f}), suggesting that {worst} optimisation would yield the largest score uplift.")
            else:
                rationale = "Insufficient data."
            ranking.append({
                "id": r["id"], "name": r["name"], "stage": r.get("stage") or stage,
                "overall_score": {"mean": round(ov["mean"], 4), "ci_low": round(ov["ci_low"], 4), "ci_high": round(ov["ci_high"], 4)},
                "confidence_label": r.get("confidence_label", "Low"),
                "properties": {k: {"mean": round(props[k]["mean"], 4), "ci_low": round(props[k]["ci_low"], 4), "ci_high": round(props[k]["ci_high"], 4)} for k in ("efficacy", "safety", "admet", "developability") if k in props},
                "rationale": rationale,
            })
        sections["candidate_ranking"] = ranking

    if "safety_flags" in include_sections:
        flags_by_candidate = {}
        for r in scored_list:
            if not r.get("overall"):
                continue
            props = r.get("properties", {})
            desc = r.get("descriptors", {})
            flags = []
            for axis in ("efficacy", "safety", "admet", "developability"):
                ax = props.get(axis, {})
                mean_val = ax.get("mean", 1.0)
                if mean_val < _FLAG_THRESHOLD:
                    severity = "high" if mean_val < 0.4 else "medium"
                    flags.append({"property": axis, "axis_score": round(mean_val, 4), "threshold": _FLAG_THRESHOLD, "severity": severity, "description": f"{axis.capitalize()} axis score {mean_val:.2f} is below the {_FLAG_THRESHOLD} flag threshold."})
            for key, (label, thresh, msg) in _DESCRIPTOR_THRESHOLDS.items():
                val = desc.get(key)
                if val is not None and float(val) > thresh:
                    flags.append({"property": label, "value": round(float(val), 2), "threshold": thresh, "severity": "high" if float(val) > thresh * 1.3 else "medium", "description": f"{r['name']}: {label} {float(val):.2f} {msg}"})
            flags_by_candidate[r["name"]] = flags
        sections["safety_flags"] = flags_by_candidate

    if "trial_landscape" in include_sections:
        sections["trial_landscape"] = (f"Live ClinicalTrials.gov integration scheduled for Phase 9. In a live report this section would enumerate active Phase II/III trials in {indication}, their primary endpoints, and key failure modes to avoid.")

    if "recommendations" in include_sections:
        recs = []
        if scored_list and scored_list[0].get("overall"):
            top = scored_list[0]
            recs.append(f"Prioritise {top['name']} for next synthesis round — highest overall score ({top['overall']['mean']:.2f}) and {top.get('confidence_label', 'Low').lower()} model confidence.")
        for r in scored_list:
            if not r.get("properties"):
                continue
            fc = sum(1 for k in ("safety", "admet") if r["properties"].get(k, {}).get("mean", 1.0) < _FLAG_THRESHOLD)
            if fc >= 1:
                recs.append(f"Review {r['name']} safety and ADMET profile before progressing — {fc} flag{'s' if fc > 1 else ''} raised.")
        if len(scored_list) > 1 and scored_list[-1].get("overall"):
            last = scored_list[-1]
            recs.append(f"Consider deprioritising {last['name']} — lowest overall score ({last['overall']['mean']:.2f}).")
        recs.append(f"Expand the candidate set in the {indication} programme to tighten credible intervals.")
        sections["recommendations"] = recs

    sections["metadata"] = {
        "project_name": project_name, "indication": indication, "stage": stage,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "engine_version": "v0",
        "data_sources": ["RDKit descriptors", "Bayesian scoring model", "Sample SMILES — public structures"],
    }

    return {"project_name": project_name, "indication": indication, "stage": stage, "sections": sections, "candidate_ids": candidates_ids}


@app.post("/report")
def generate_report(request: ReportRequest):
    """Decision Intelligence Report — Phase 8."""
    include_sections = request.include_sections or ["executive_summary", "candidate_ranking", "safety_flags", "trial_landscape", "recommendations"]
    return _build_report(project_name=request.project_name, candidates_ids=request.candidates, indication=request.indication, stage=request.stage, include_sections=include_sections)


@app.get("/reports/sample")
def sample_report():
    """Pre-generated sample report for Project APOLLO — for frontend demo."""
    return _build_report(project_name="Project APOLLO", candidates_ids=["AX-7291", "AX-6104", "AX-5892"], indication="EGFR-driven non-small cell lung cancer", stage="Lead Optimisation", include_sections=["executive_summary", "candidate_ranking", "safety_flags", "trial_landscape", "recommendations"])


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
