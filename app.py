"""
PHOENIX - Agentic AI Drug Discovery System (Minimal Prototype)

A simple prototype that:
  1. Loads placeholder compound and toxicity data
  2. Scores compounds using a Bayesian probability-of-success model
  3. Ranks and displays the top candidates

Run: python app.py
"""

from dataclasses import dataclass
from typing import Dict, List, Tuple

# --- Agent definitions (PHOENIX) ---
AGENTS = {
    "scout": {
        "weight": 0.4,
        "description": "Optimises for efficacy / upside",
    },
    "safety": {
        "weight": 0.4,
        "description": "Minimises toxicity / risk",
    },
    "strategy": {
        "weight": 0.2,
        "description": "Balances risk vs reward",
    },
}


# -----------------------------------------------------------------------------
# Data structures
# -----------------------------------------------------------------------------


@dataclass
class Compound:
    """Represents a drug candidate with basic properties."""

    id: str
    name: str
    # Simple efficacy proxy (0-1): higher = better predicted activity
    efficacy_signal: float
    # Molecular weight (placeholder for real descriptors)
    mw: float


@dataclass
class ToxicityRecord:
    """Toxicity assessment for a compound (placeholder)."""

    compound_id: str
    # Risk score 0-1: 0 = safe, 1 = high risk
    risk_score: float


# -----------------------------------------------------------------------------
# Placeholder data
# -----------------------------------------------------------------------------


def load_compounds() -> List[Compound]:
    """Load placeholder compound library (in real system: from DB or files)."""
    return [
        Compound("C001", "Compound Alpha", efficacy_signal=0.72, mw=342.4),
        Compound("C002", "Compound Beta", efficacy_signal=0.85, mw=298.1),
        Compound("C003", "Compound Gamma", efficacy_signal=0.61, mw=410.2),
        Compound("C004", "Compound Delta", efficacy_signal=0.91, mw=275.8),
        Compound("C005", "Compound Epsilon", efficacy_signal=0.55, mw=389.0),
        Compound("C006", "Compound Zeta", efficacy_signal=0.78, mw=315.6),
    ]


def load_toxicity() -> List[ToxicityRecord]:
    """Load placeholder toxicity data (in real system: from assays/ML model)."""
    return [
        ToxicityRecord("C001", risk_score=0.15),
        ToxicityRecord("C002", risk_score=0.08),
        ToxicityRecord("C003", risk_score=0.42),
        ToxicityRecord("C004", risk_score=0.05),
        ToxicityRecord("C005", risk_score=0.38),
        ToxicityRecord("C006", risk_score=0.22),
    ]


# -----------------------------------------------------------------------------
# Bayesian scoring
# -----------------------------------------------------------------------------


def bayesian_score_compound(
    efficacy_signal: float,
    toxicity_risk: float,
    prior_success: float = 0.1,
) -> float:
    """
    Compute P(success) for a compound using a simple Bayesian-style model.

    Idea:
      - Prior: base rate of success (e.g. 10% of candidates reach clinic).
      - Likelihood: proportional to efficacy and (1 - toxicity_risk).
      - Posterior ∝ prior * likelihood; we use a simple product form.

    Args:
        efficacy_signal: 0-1, higher = better predicted efficacy.
        toxicity_risk: 0-1, higher = more toxic (worse).
        prior_success: base probability of success (default 0.1).

    Returns:
        Unnormalized score proportional to P(success). Used for ranking.
    """
    # Likelihood: success more likely when efficacy is high and toxicity is low
    likelihood = efficacy_signal * (1.0 - toxicity_risk)
    # Posterior proportional to prior * likelihood (Bayes)
    score = prior_success * likelihood
    return score


def agent_score(agent_name: str, efficacy: float, toxicity_risk: float) -> float:
    """
    Each agent scores the same compound differently.
    Higher score = better.
    """
    # Clamp safety (avoid weird >1 / <0 inputs)
    efficacy = max(0.0, min(1.0, efficacy))
    toxicity_risk = max(0.0, min(1.0, toxicity_risk))

    if agent_name == "scout":
        # Scout cares about upside; toxicity matters but not as much
        return efficacy * (1 - 0.5 * toxicity_risk)

    if agent_name == "safety":
        # Safety agent punishes toxicity hard
        return efficacy * max(0.0, (1 - 2.0 * toxicity_risk))

    # strategy (default)
    return efficacy * (1 - 1.0 * toxicity_risk)


def consensus_score(efficacy: float, toxicity_risk: float) -> Tuple[float, Dict[str, float]]:
    """
    Weighted consensus across all agents.

    Returns:
      - final_score
      - breakdown dict per agent {agent_name: agent_score}
    """
    breakdown: Dict[str, float] = {}
    total = 0.0
    for name, cfg in AGENTS.items():
        s = agent_score(name, efficacy, toxicity_risk)
        breakdown[name] = s
        total += cfg["weight"] * s
    return total, breakdown


def rank_compounds(compounds: List[Compound], toxicity_records: List[ToxicityRecord]) -> List[Dict]:
    """Rank compounds by consensus score descending."""
    tox_lookup = {t.compound_id: t.risk_score for t in toxicity_records}

    ranked = []
    for c in compounds:
        toxicity = tox_lookup.get(c.id, 0.5)

        # Consensus across agents
        score, breakdown = consensus_score(c.efficacy_signal, toxicity)

        ranked.append(
            {
                "id": c.id,
                "name": c.name,
                "score": score,
                "efficacy": c.efficacy_signal,
                "toxicity": toxicity,
                # Compatibility alias for UIs expecting this key name.
                "toxicity_risk": toxicity,
                "agent_breakdown": breakdown,
                # Compatibility alias for UIs expecting this key name.
                "agents": breakdown,
            }
        )

    ranked.sort(key=lambda x: x["score"], reverse=True)
    return ranked


# -----------------------------------------------------------------------------
# Main app
# -----------------------------------------------------------------------------


def main() -> None:
    print("PHOENIX - Agentic AI Drug Discovery (Prototype)\n" + "=" * 50)

    # Load placeholder data
    compounds = load_compounds()
    toxicity = load_toxicity()
    print(f"Loaded {len(compounds)} compounds, {len(toxicity)} toxicity records.\n")

    # Ranking
    ranked = rank_compounds(compounds, toxicity)

    print("Ranked candidates:")
    print("-" * 60)

    for i, item in enumerate(ranked, start=1):
        print(f"{i}. {item['id']} {item['name']}")
        print(
            "   Score: "
            f"{item['score']:.4f} "
            f"(efficacy={item['efficacy']:.2f}, toxicity_risk={item['toxicity']:.2f})"
        )
        breakdown = item["agent_breakdown"]
        print(
            "   Agents: "
            f"scout={breakdown['scout']:.3f}, "
            f"safety={breakdown['safety']:.3f}, "
            f"strategy={breakdown['strategy']:.3f}"
        )

    print("\nDone.")


if __name__ == "__main__":
    main()
