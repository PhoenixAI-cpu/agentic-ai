from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
import random
from typing import Any, Dict, List, Tuple


@dataclass
class EvidenceLedger:
    """Simple in-memory ledger for evidence attached to compounds."""

    entries: Dict[str, List[Dict[str, Any]]] = field(default_factory=dict)

    def add(self, compound_id: str, source: str, note: str, weight: float) -> None:
        self.entries.setdefault(compound_id, []).append(
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source": source,
                "note": note,
                "weight": float(weight),
            }
        )

    def get(self, compound_id: str) -> List[Dict[str, Any]]:
        return self.entries.get(compound_id, [])

    def as_dict(self) -> Dict[str, List[Dict[str, Any]]]:
        return self.entries


def _clamp(value: float, lower: float = 0.0, upper: float = 1.0) -> float:
    return max(lower, min(upper, value))


def rank_with_evidence(
    n_candidates: int = 20,
    seed: int = 7,
) -> Tuple[List[Dict[str, Any]], EvidenceLedger]:
    """
    Produce ranked compound candidates and a lightweight evidence ledger.

    Returns:
        (results, ledger)
        results is sorted by descending score.
    """
    rng = random.Random(seed)
    ledger = EvidenceLedger()
    results: List[Dict[str, Any]] = []

    for idx in range(1, n_candidates + 1):
        compound_id = f"CMPD-{idx:03d}"
        name = f"PHX-{idx:03d}"

        efficacy = rng.uniform(0.45, 0.95)
        toxicity = rng.uniform(0.05, 0.45)

        scout_score = _clamp(efficacy + rng.gauss(0, 0.06))
        safety_score = _clamp((1.0 - toxicity) + rng.gauss(0, 0.05))
        strategy_score = _clamp((0.65 * efficacy + 0.35 * (1.0 - toxicity)) + rng.gauss(0, 0.05))
        challenge_score = _clamp((1.0 - abs(efficacy - (1.0 - toxicity))) + rng.gauss(0, 0.08))

        score = _clamp(
            0.33 * scout_score
            + 0.34 * safety_score
            + 0.20 * strategy_score
            + 0.13 * challenge_score
        )
        bayesian_probability = _clamp(0.55 * score + 0.45 * (efficacy * (1.0 - toxicity)))

        ledger.add(
            compound_id,
            source="omics-scout",
            note=f"High efficacy signal at {efficacy:.2%}",
            weight=scout_score,
        )
        ledger.add(
            compound_id,
            source="safety-screen",
            note=f"Toxicity risk estimate {toxicity:.2%}",
            weight=safety_score,
        )

        results.append(
            {
                "id": compound_id,
                "name": name,
                "score": score,
                "bayesian_probability": bayesian_probability,
                "efficacy": efficacy,
                "toxicity": toxicity,
                "agents": {
                    "scout": scout_score,
                    "safety": safety_score,
                    "strategy": strategy_score,
                    "challenge": challenge_score,
                },
            }
        )

    results.sort(key=lambda item: item["score"], reverse=True)
    return results, ledger
