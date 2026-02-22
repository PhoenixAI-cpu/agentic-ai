import os
import sys

import streamlit as st

# Add the current directory to path so we can import phoenix.
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from phoenix.rank import rank_compounds

st.set_page_config(page_title="PHOENIX", page_icon="🧬", layout="wide")

st.title("🧪 PHOENIX")
st.markdown("Precision Hybrid Omics-driven Engine for Novel Intelligent Xenobiotics")

# Load and display rankings.
with st.spinner("Analyzing compounds..."):
    results, ledger = rank_compounds()

# Show results.
for r in results:
    with st.expander(f"{r['name']} - Score: {r['score']:.3f}"):
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Efficacy", f"{r['efficacy']:.1%}")
            st.metric("Toxicity", f"{r['toxicity']:.1%}")
        with col2:
            st.metric("Bayesian P(Success)", f"{r['bayesian_probability']:.1%}")
            st.metric("Overall Score", f"{r['score']:.3f}")

if ledger:
    with st.expander("Calculation ledger"):
        st.json(ledger)
