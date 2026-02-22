"""Compound ranking logic for the PHOENIX Streamlit demo."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple


AGENTS: dict[str, dict[str, float]] = {
    "scout": {"weight": 0.4},
    "safety": {"weight": 0.4},
    "strategy": {"weight": 0.2},
}


@dataclass(frozen=True)
class Compound:
    """Drug candidate with efficacy and basic metadata."""

    id: str
    name: str
    efficacy_signal: float
    molecular_weight: float


@dataclass(frozen=True)
class ToxicityRecord:
    """Toxicity risk for a candidate."""

    compound_id: str
    risk_score: float


def _load_compounds() -> List[Compound]:
    return [
        Compound("C001", "Compound Alpha", efficacy_signal=0.72, molecular_weight=342.4),
        Compound("C002", "Compound Beta", efficacy_signal=0.85, molecular_weight=298.1),
        Compound("C003", "Compound Gamma", efficacy_signal=0.61, molecular_weight=410.2),
        Compound("C004", "Compound Delta", efficacy_signal=0.91, molecular_weight=275.8),
        Compound("C005", "Compound Epsilon", efficacy_signal=0.55, molecular_weight=389.0),
        Compound("C006", "Compound Zeta", efficacy_signal=0.78, molecular_weight=315.6),
    ]


def _load_toxicity() -> List[ToxicityRecord]:
    return [
        ToxicityRecord("C001", risk_score=0.15),
        ToxicityRecord("C002", risk_score=0.08),
        ToxicityRecord("C003", risk_score=0.42),
        ToxicityRecord("C004", risk_score=0.05),
        ToxicityRecord("C005", risk_score=0.38),
        ToxicityRecord("C006", risk_score=0.22),
    ]


def _clamp_probability(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def bayesian_score_compound(
    efficacy_signal: float,
    toxicity_risk: float,
    prior_success: float = 0.1,
) -> float:
    """
    Approximate P(success) with a simple Bayesian-style product model.
    """
    efficacy = _clamp_probability(efficacy_signal)
    toxicity = _clamp_probability(toxicity_risk)
    prior = _clamp_probability(prior_success)
    likelihood = efficacy * (1.0 - toxicity)
    return prior * likelihood


def _agent_score(agent_name: str, efficacy: float, toxicity_risk: float) -> float:
    efficacy = _clamp_probability(efficacy)
    toxicity = _clamp_probability(toxicity_risk)

    if agent_name == "scout":
        return efficacy * (1.0 - 0.5 * toxicity)
    if agent_name == "safety":
        return efficacy * max(0.0, (1.0 - 2.0 * toxicity))
    return efficacy * (1.0 - toxicity)


def _consensus_score(efficacy: float, toxicity_risk: float) -> Tuple[float, Dict[str, float]]:
    breakdown: Dict[str, float] = {}
    score_total = 0.0

    for agent_name, agent_cfg in AGENTS.items():
        agent_result = _agent_score(agent_name, efficacy, toxicity_risk)
        breakdown[agent_name] = agent_result
        score_total += agent_cfg["weight"] * agent_result

    return score_total, breakdown


def rank_compounds() -> tuple[list[dict[str, float | str]], list[dict[str, object]]]:
    """
    Rank compounds and return:
      1) results: display-friendly list for the Streamlit page
      2) ledger: transparent breakdown of intermediate calculations
    """
    compounds = _load_compounds()
    toxicity_lookup = {item.compound_id: item.risk_score for item in _load_toxicity()}

    results: list[dict[str, float | str]] = []
    ledger: list[dict[str, object]] = []

    for compound in compounds:
        toxicity = toxicity_lookup.get(compound.id, 0.5)
        bayesian_probability = bayesian_score_compound(compound.efficacy_signal, toxicity)
        consensus, agent_breakdown = _consensus_score(compound.efficacy_signal, toxicity)

        # Weight consensus strongly while still surfacing Bayesian probability.
        overall_score = (0.8 * consensus) + (0.2 * bayesian_probability)

        results.append(
            {
                "id": compound.id,
                "name": compound.name,
                "efficacy": compound.efficacy_signal,
                "toxicity": toxicity,
                "bayesian_probability": bayesian_probability,
                "score": overall_score,
            }
        )

        ledger.append(
            {
                "id": compound.id,
                "name": compound.name,
                "consensus_score": consensus,
                "bayesian_probability": bayesian_probability,
                "overall_score": overall_score,
                "agent_breakdown": agent_breakdown,
            }
        )

    results.sort(key=lambda row: float(row["score"]), reverse=True)
    ledger.sort(key=lambda row: float(row["overall_score"]), reverse=True)

    return results, ledger
