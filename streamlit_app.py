from __future__ import annotations

from typing import Any, Iterable, Mapping

import pandas as pd
import streamlit as st

from app import load_compounds, load_toxicity, rank_compounds


def _to_float(value: Any, default: float) -> float:
    """Best-effort numeric conversion with a safe fallback."""
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return default

    # Guard against NaN values.
    if parsed != parsed:
        return default

    return parsed


def _to_optional_float(value: Any) -> float | None:
    """Convert to float or return None when value is missing/invalid."""
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None

    if parsed != parsed:
        return None

    return parsed


def _extract_value(obj: Any, field_names: tuple[str, ...], default: Any = None) -> Any:
    """Read a field from dict-like or object-like values using fallback names."""
    if isinstance(obj, Mapping):
        for field in field_names:
            value = obj.get(field)
            if value is not None:
                return value
        return default

    for field in field_names:
        value = getattr(obj, field, None)
        if value is not None:
            return value

    return default


def _build_toxicity_lookup(toxicity_records: Iterable[Any]) -> dict[str, float]:
    lookup: dict[str, float] = {}
    for record in toxicity_records:
        compound_id = _extract_value(record, ("compound_id", "id"))
        if compound_id is None:
            continue

        risk_score = _extract_value(record, ("risk_score", "toxicity_risk", "toxicity"), 0.5)
        lookup[str(compound_id)] = _to_float(risk_score, default=0.5)

    return lookup


def _normalize_ranked_item(item: Any, toxicity_lookup: Mapping[str, float]) -> dict[str, Any] | None:
    agents: Mapping[str, Any]

    if isinstance(item, Mapping):
        compound_id = _extract_value(item, ("id", "compound_id"))
        if compound_id is None:
            return None

        score = _to_float(_extract_value(item, ("score",), 0.0), default=0.0)
        efficacy = _to_float(_extract_value(item, ("efficacy", "efficacy_signal"), 0.0), default=0.0)
        toxicity = _extract_value(
            item,
            ("toxicity_risk", "toxicity"),
            toxicity_lookup.get(str(compound_id), 0.5),
        )
        agents = _extract_value(item, ("agents", "agent_breakdown"), {}) or {}
        name = _extract_value(item, ("name",), f"Compound {compound_id}")
    elif isinstance(item, (list, tuple)) and len(item) >= 2:
        compound, score_value = item[0], item[1]
        compound_id = _extract_value(compound, ("id", "compound_id"))
        if compound_id is None:
            return None

        score = _to_float(score_value, default=0.0)
        efficacy = _to_float(_extract_value(compound, ("efficacy_signal", "efficacy"), 0.0), default=0.0)
        toxicity = _extract_value(
            compound,
            ("toxicity_risk", "toxicity"),
            toxicity_lookup.get(str(compound_id), 0.5),
        )
        agents = _extract_value(compound, ("agents", "agent_breakdown"), {}) or {}
        name = _extract_value(compound, ("name",), f"Compound {compound_id}")
    else:
        return None

    if not isinstance(agents, Mapping):
        agents = {}

    toxicity_value = _to_float(toxicity, default=toxicity_lookup.get(str(compound_id), 0.5))

    return {
        "ID": str(compound_id),
        "Name": str(name),
        "Consensus Score": score,
        "Efficacy": efficacy,
        "Toxicity Risk": toxicity_value,
        "Scout": _to_optional_float(agents.get("scout")),
        "Safety": _to_optional_float(agents.get("safety")),
        "Strategy": _to_optional_float(agents.get("strategy")),
    }


def build_ranked_dataframe(ranked_items: Iterable[Any], toxicity_records: Iterable[Any]) -> pd.DataFrame:
    columns = [
        "ID",
        "Name",
        "Consensus Score",
        "Efficacy",
        "Toxicity Risk",
        "Scout",
        "Safety",
        "Strategy",
    ]

    toxicity_lookup = _build_toxicity_lookup(toxicity_records)
    rows: list[dict[str, Any]] = []
    for item in ranked_items:
        normalized = _normalize_ranked_item(item, toxicity_lookup)
        if normalized is not None:
            rows.append(normalized)

    if not rows:
        return pd.DataFrame(columns=columns)

    df = pd.DataFrame(rows, columns=columns)
    df = df.sort_values("Consensus Score", ascending=False, ignore_index=True)
    return df


st.set_page_config(page_title="PHOENIX", layout="wide")

st.title("PHOENIX - Agentic AI Drug Discovery")
st.caption("Minimal prototype UI: ranked compounds + agent breakdown + export.")

compounds = load_compounds()
toxicity = load_toxicity()
ranked = rank_compounds(compounds, toxicity)

df = build_ranked_dataframe(ranked, toxicity)

st.subheader("Ranked Candidates")
if df.empty:
    st.warning("No ranked candidates were generated from the current inputs.")
else:
    st.dataframe(df, use_container_width=True)

st.download_button(
    "Download results as CSV",
    data=df.to_csv(index=False).encode("utf-8"),
    file_name="phoenix_ranked_candidates.csv",
    mime="text/csv",
    disabled=df.empty,
)

st.info("Next: ML prediction + Bayesian uncertainty + Monte Carlo simulations.")
