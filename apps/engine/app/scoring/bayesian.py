"""Bayesian candidate scoring with calibrated uncertainty.

Approach: each property score is modelled as a Beta posterior. The prior is
Beta(2, 2) (weakly informative, centred on 0.5). Evidence from molecular
descriptors updates the posterior via pseudo-observations: each desirability
rule contributes successes/failures weighted by rule reliability.
This keeps the model fully interpretable — every score decomposes into
named rules with stated weights.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from scipy.stats import beta as beta_dist

from .descriptors import compute_descriptors

# Weakly informative prior centred on 0.5.
PRIOR_ALPHA = 2.0
PRIOR_BETA = 2.0

# Overall blend weights across the four property axes.
OVERALL_WEIGHTS = {
    "efficacy": 0.30,
    "safety": 0.30,
    "admet": 0.25,
    "developability": 0.15,
}


@dataclass
class PropertyScore:
    mean: float
    ci_low: float
    ci_high: float
    evidence: list[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "mean": round(self.mean, 4),
            "ci_low": round(self.ci_low, 4),
            "ci_high": round(self.ci_high, 4),
            "ci_width": round(self.ci_high - self.ci_low, 4),
            "evidence": self.evidence,
        }


@dataclass
class CandidateScore:
    overall: PropertyScore
    properties: dict[str, PropertyScore]
    confidence_label: str
    descriptors: dict

    def to_dict(self) -> dict:
        return {
            "overall": self.overall.to_dict(),
            "confidence_label": self.confidence_label,
            "properties": {k: v.to_dict() for k, v in self.properties.items()},
            "descriptors": self.descriptors,
        }


def _soft_le(value: float, threshold: float, width_frac: float = 0.10) -> float:
    """Soft satisfaction in [0,1] for the rule `value <= threshold`.

    A sigmoid ramp of width ~10% of the threshold gives ~1.0 well below the
    threshold, 0.5 at it, and ~0.0 well above — so near-boundary molecules
    contribute fractional evidence rather than a hard pass/fail.
    """
    width = max(abs(threshold) * width_frac, 1e-6)
    k = 4.0 / width  # logistic slope so +/- width spans the ramp
    return 1.0 / (1.0 + pow(2.718281828459045, k * (value - threshold)))


def _soft_ge(value: float, threshold: float, width_frac: float = 0.10) -> float:
    """Soft satisfaction in [0,1] for the rule `value >= threshold`."""
    return 1.0 - _soft_le(value, threshold, width_frac)


def _soft_between(value: float, low: float, high: float, width_frac: float = 0.10) -> float:
    """Soft satisfaction for `low <= value <= high` (product of two ramps)."""
    return _soft_ge(value, low, width_frac) * _soft_le(value, high, width_frac)


def _scaled(value: float) -> float:
    """Clamp an already-[0,1] descriptor (e.g. QED) to [0,1]."""
    return max(0.0, min(1.0, value))


# Each rule: (name, satisfaction in [0,1], weight, raw value, one-line rationale).
def _efficacy_rules(d: dict) -> list[tuple]:
    return [
        ("QED drug-likeness", _scaled(d["qed"]), 3.0, d["qed"],
         "Higher QED correlates with optimised, target-engaging chemical matter."),
        ("Aromatic rings 1-4", _soft_between(d["aromatic_rings"], 1, 4), 1.0, d["aromatic_rings"],
         "Aromatic scaffolds drive binding affinity but excess flatness hurts."),
        ("TPSA 40-130", _soft_between(d["tpsa"], 40, 130), 1.0, d["tpsa"],
         "Moderate polar surface area balances permeability and target contact."),
    ]


def _safety_rules(d: dict) -> list[tuple]:
    return [
        ("logP <= 3.5", _soft_le(d["logp"], 3.5), 2.0, d["logp"],
         "High lipophilicity correlates with off-target and toxicity liabilities."),
        ("MW <= 450", _soft_le(d["molecular_weight"], 450), 1.0, d["molecular_weight"],
         "Lower molecular weight reduces promiscuity and metabolic burden."),
        ("Aromatic rings <= 3", _soft_le(d["aromatic_rings"], 3), 1.0, d["aromatic_rings"],
         "Excess aromatic ring count is a recognised toxicity risk factor."),
    ]


def _admet_rules(d: dict) -> list[tuple]:
    return [
        ("Lipinski MW <= 500", _soft_le(d["molecular_weight"], 500), 1.0, d["molecular_weight"],
         "Lipinski: oral absorption falls off above 500 Da."),
        ("Lipinski logP <= 5", _soft_le(d["logp"], 5), 1.0, d["logp"],
         "Lipinski: logP above 5 impairs solubility and absorption."),
        ("Lipinski HBD <= 5", _soft_le(d["hbd"], 5), 1.0, d["hbd"],
         "Lipinski: excess H-bond donors reduce membrane permeability."),
        ("Lipinski HBA <= 10", _soft_le(d["hba"], 10), 1.0, d["hba"],
         "Lipinski: excess H-bond acceptors reduce passive permeability."),
        ("TPSA <= 140", _soft_le(d["tpsa"], 140), 1.0, d["tpsa"],
         "Veber: TPSA above 140 predicts poor oral bioavailability."),
        ("Rotatable bonds <= 10", _soft_le(d["rotatable_bonds"], 10), 1.0, d["rotatable_bonds"],
         "Veber: more than 10 rotatable bonds reduces oral bioavailability."),
    ]


def _developability_rules(d: dict) -> list[tuple]:
    return [
        ("QED drug-likeness", _scaled(d["qed"]), 2.0, d["qed"],
         "High QED indicates a developable, well-balanced property profile."),
        ("MW 200-500", _soft_between(d["molecular_weight"], 200, 500), 1.0, d["molecular_weight"],
         "A mid-range molecular weight eases formulation and synthesis."),
        ("Rotatable bonds <= 8", _soft_le(d["rotatable_bonds"], 8), 1.0, d["rotatable_bonds"],
         "Lower flexibility improves crystallinity and developability."),
    ]


_RULE_FNS = {
    "efficacy": _efficacy_rules,
    "safety": _safety_rules,
    "admet": _admet_rules,
    "developability": _developability_rules,
}


def _posterior(alpha: float, beta: float) -> tuple[float, float, float]:
    """Return (mean, 2.5% CI, 97.5% CI) of a Beta(alpha, beta) posterior."""
    mean = alpha / (alpha + beta)
    ci_low, ci_high = beta_dist.ppf([0.025, 0.975], alpha, beta)
    return float(mean), float(ci_low), float(ci_high)


def score_property(descriptors: dict, property_name: str) -> PropertyScore:
    """Score a single property axis as a Beta posterior over the rules."""
    if property_name not in _RULE_FNS:
        raise ValueError(f"Unknown property: {property_name}")
    alpha, beta = PRIOR_ALPHA, PRIOR_BETA
    evidence: list[dict] = []
    for name, sat, weight, raw, rationale in _RULE_FNS[property_name](descriptors):
        # Fully satisfied rule adds `weight` to alpha (success); fully violated
        # adds `weight` to beta (failure); fractional in between.
        contribution = sat * weight
        alpha += contribution
        beta += (1.0 - sat) * weight
        evidence.append({
            "rule": name,
            "value": round(float(raw), 3),
            "satisfaction": round(float(sat), 3),
            "weight": weight,
            "contribution": round(float(contribution), 3),
            "direction": "supports" if sat >= 0.5 else "detracts",
            "rationale": rationale,
        })
    mean, ci_low, ci_high = _posterior(alpha, beta)
    return PropertyScore(mean=mean, ci_low=ci_low, ci_high=ci_high, evidence=evidence)


def _combine_overall(props: dict[str, PropertyScore]) -> PropertyScore:
    """Weighted-mean blend of property posteriors with a combined CI.

    Means combine via the fixed axis weights; the CI is the same weighted
    blend of each axis's credible bounds (a transparent first-order combine).
    """
    mean = sum(OVERALL_WEIGHTS[k] * props[k].mean for k in OVERALL_WEIGHTS)
    ci_low = sum(OVERALL_WEIGHTS[k] * props[k].ci_low for k in OVERALL_WEIGHTS)
    ci_high = sum(OVERALL_WEIGHTS[k] * props[k].ci_high for k in OVERALL_WEIGHTS)
    return PropertyScore(mean=mean, ci_low=ci_low, ci_high=ci_high, evidence=[])


def _confidence_label(overall: PropertyScore) -> str:
    width = overall.ci_high - overall.ci_low
    if width < 0.25 and overall.mean > 0.7:
        return "High"
    if width < 0.35:
        return "Medium"
    return "Low"


def score_candidate(
    smiles: str,
    descriptors: Optional[dict] = None,
    enrich_with_chembl: Optional[str] = None,
) -> CandidateScore:
    """Score a candidate end-to-end from its SMILES string.

    Args:
        smiles: SMILES string of the candidate molecule.
        descriptors: Pre-computed descriptor dict (optional).
        enrich_with_chembl: ChEMBL ID to fetch bioactivity evidence for the
            efficacy score. If provided and reachable, the top 3 IC50/Ki
            values are added to the efficacy PropertyScore evidence list.
            Scoring still works if this call fails or is omitted.
    """
    d = descriptors if descriptors is not None else compute_descriptors(smiles)
    props = {name: score_property(d, name) for name in _RULE_FNS}

    # Optional: enrich efficacy score with real bioactivity data from ChEMBL.
    if enrich_with_chembl:
        try:
            import asyncio
            from ..pipelines.chembl import ChEMBLPipeline

            async def _fetch():
                pipeline = ChEMBLPipeline()
                return await pipeline.get_bioactivity(enrich_with_chembl)

            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # Inside an async context — use run_in_executor pattern
                    import concurrent.futures
                    with concurrent.futures.ThreadPoolExecutor() as pool:
                        future = pool.submit(asyncio.run, _fetch())
                        activities = future.result(timeout=10)
                else:
                    activities = loop.run_until_complete(_fetch())
            except RuntimeError:
                activities = asyncio.run(_fetch())

            # Filter IC50/Ki records and take top 3 by value (lower = more potent)
            potency_types = {"IC50", "Ki", "Kd", "EC50"}
            potency = [
                a for a in activities
                if a.get("activity_type") in potency_types and a.get("value") is not None
            ]
            potency.sort(key=lambda a: float(a["value"]))
            top3 = potency[:3]

            bioactivity_evidence = [
                {
                    "rule": f"ChEMBL {a['activity_type']} ({a.get('target_pref_name', 'unknown target')})",
                    "value": float(a["value"]),
                    "satisfaction": 1.0,
                    "weight": 0.0,  # informational only — does not shift the posterior
                    "contribution": 0.0,
                    "direction": "supports",
                    "rationale": (
                        f"{a['activity_type']}={a['value']} {a.get('units', 'nM')} "
                        f"from assay {a.get('assay_chembl_id', 'N/A')}"
                    ),
                }
                for a in top3
            ]
            if bioactivity_evidence:
                props["efficacy"].evidence = bioactivity_evidence + props["efficacy"].evidence
        except Exception:
            # Enrichment is best-effort; never fail scoring because of it.
            pass

    overall = _combine_overall(props)
    return CandidateScore(
        overall=overall,
        properties=props,
        confidence_label=_confidence_label(overall),
        descriptors=d,
    )
