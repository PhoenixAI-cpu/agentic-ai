from datetime import datetime
import json

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from app import rank_with_evidence


st.set_page_config(
    page_title="PHOENIX - Drug Discovery Platform",
    page_icon="🧬",
    layout="wide",
    initial_sidebar_state="collapsed",
)


st.markdown(
    """
<style>
    .main > div {
        padding: 0rem 1rem;
    }

    .phoenix-header {
        background: linear-gradient(90deg, #1a237e 0%, #0d47a1 100%);
        padding: 1.5rem 2rem;
        border-radius: 0px;
        margin: -1rem -1rem 1rem -1rem;
        color: white;
    }

    .phoenix-title {
        font-size: 2.2rem;
        font-weight: 600;
        margin: 0;
        color: white;
    }

    .phoenix-subtitle {
        font-size: 0.9rem;
        opacity: 0.8;
        margin: 0;
        color: #e0e0e0;
    }

    .metric-card {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        border: 1px solid #eaeef2;
    }

    .metric-value {
        font-size: 2.5rem;
        font-weight: 600;
        color: #1a237e;
        line-height: 1.2;
    }

    .metric-label {
        font-size: 0.9rem;
        color: #6c757d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .chart-container {
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        border: 1px solid #eaeef2;
        margin-bottom: 1rem;
    }

    .chart-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #1a237e;
        margin-bottom: 1rem;
    }
</style>
""",
    unsafe_allow_html=True,
)


def run_monte_carlo_simulation(
    compound_data: list[dict],
    n_simulations: int = 1000,
    confidence_level: float = 0.95,
) -> list[dict]:
    """Run Monte Carlo simulation for compound success probability."""
    alpha = (1.0 - confidence_level) / 2.0
    lower_q = 100 * alpha
    upper_q = 100 * (1.0 - alpha)
    results = []

    for compound in compound_data:
        efficacy = float(compound["efficacy"])
        toxicity = float(compound["toxicity"])
        simulated_scores = []

        for _ in range(n_simulations):
            efficacy_var = np.random.normal(0, 0.1)
            toxicity_var = np.random.normal(0, 0.15)

            sim_efficacy = float(np.clip(efficacy + efficacy_var, 0, 1))
            sim_toxicity = float(np.clip(toxicity + toxicity_var, 0, 1))

            sim_score = sim_efficacy * (1 - 1.5 * sim_toxicity) + np.random.normal(0, 0.05)
            simulated_scores.append(float(np.clip(sim_score, 0, 1)))

        ci_lower = float(np.percentile(simulated_scores, lower_q))
        ci_upper = float(np.percentile(simulated_scores, upper_q))

        results.append(
            {
                "name": compound["name"],
                "id": compound["id"],
                "mean_score": float(np.mean(simulated_scores)),
                "std_dev": float(np.std(simulated_scores)),
                "p5": float(np.percentile(simulated_scores, 5)),
                "p95": float(np.percentile(simulated_scores, 95)),
                "ci_lower": ci_lower,
                "ci_upper": ci_upper,
                "success_probability": float(np.mean([s > 0.5 for s in simulated_scores])),
                "all_scores": simulated_scores,
            }
        )

    return results


if "current_page" not in st.session_state:
    st.session_state.current_page = "Dashboard"

st.markdown(
    """
<div class="phoenix-header">
    <h1 class="phoenix-title">PHOENIX</h1>
    <p class="phoenix-subtitle">Precision Hybrid Omics-driven Engine for Novel Intelligent Xenobiotics</p>
</div>
""",
    unsafe_allow_html=True,
)

col1, col2, col3, col4, col5 = st.columns(5)
with col1:
    if st.button("📊 Dashboard", use_container_width=True):
        st.session_state.current_page = "Dashboard"
with col2:
    if st.button("🧪 Projects", use_container_width=True):
        st.session_state.current_page = "Projects"
with col3:
    if st.button("🤖 Models", use_container_width=True):
        st.session_state.current_page = "Models"
with col4:
    if st.button("📈 Monte Carlo", use_container_width=True):
        st.session_state.current_page = "Monte Carlo"
with col5:
    if st.button("📋 Reports", use_container_width=True):
        st.session_state.current_page = "Reports"

st.markdown("---")

with st.spinner("🤖 Analyzing compounds..."):
    try:
        results, ledger = rank_with_evidence()
    except Exception as exc:  # pragma: no cover
        st.error(f"Failed to rank compounds: {exc}")
        st.stop()

if not results:
    st.warning("No compound data available.")
    st.stop()

if st.session_state.current_page == "Dashboard":
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.markdown(
            f"""
        <div class="metric-card">
            <div class="metric-value">{len(results)}</div>
            <div class="metric-label">New Drug Candidates</div>
        </div>
        """,
            unsafe_allow_html=True,
        )

    with col2:
        in_development = sum(1 for r in results if r["score"] > 0.55)
        st.markdown(
            f"""
        <div class="metric-card">
            <div class="metric-value">{in_development}</div>
            <div class="metric-label">In Development</div>
        </div>
        """,
            unsafe_allow_html=True,
        )

    with col3:
        lead_optimizations = sum(1 for r in results if r["score"] > 0.65)
        st.markdown(
            f"""
        <div class="metric-card">
            <div class="metric-value">{lead_optimizations}</div>
            <div class="metric-label">Lead Optimizations</div>
        </div>
        """,
            unsafe_allow_html=True,
        )

    with col4:
        clinical_trials = sum(1 for r in results if r["bayesian_probability"] > 0.75)
        st.markdown(
            f"""
        <div class="metric-card">
            <div class="metric-value">{clinical_trials}</div>
            <div class="metric-label">Clinical Trials</div>
        </div>
        """,
            unsafe_allow_html=True,
        )

    st.markdown("<br>", unsafe_allow_html=True)

    col1, col2 = st.columns([1, 1])
    with col1:
        st.markdown('<div class="chart-container">', unsafe_allow_html=True)
        st.markdown('<div class="chart-title">🧬 Clinical Trial Insights</div>', unsafe_allow_html=True)
        trial_metrics = {
            "Enrollment": 0.75,
            "Progress": 0.60,
            "Efficacy": float(np.mean([r["efficacy"] for r in results])),
            "Safety": float(np.mean([1.0 - r["toxicity"] for r in results])),
        }
        for metric, value in trial_metrics.items():
            st.markdown(f"**{metric}**")
            st.progress(float(np.clip(value, 0, 1)))
            st.markdown(f"<small>{value:.0%}</small>", unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="chart-container">', unsafe_allow_html=True)
        st.markdown('<div class="chart-title">📊 Top Candidates</div>', unsafe_allow_html=True)
        table_data = []
        for r in results[:5]:
            status = "In Progress" if r["score"] > 0.6 else "Pending" if r["score"] > 0.4 else "Review"
            table_data.append(
                {
                    "Compound": r["name"],
                    "Score": f'{r["score"]:.0%}',
                    "Status": status,
                }
            )
        top_df = pd.DataFrame(table_data)
        styled_df = top_df.style.applymap(
            lambda x: "color: #1976d2"
            if x == "In Progress"
            else "color: #f57c00"
            if x == "Pending"
            else "color: #6c757d",
            subset=["Status"],
        )
        st.dataframe(styled_df, use_container_width=True, hide_index=True)
        st.markdown('</div>', unsafe_allow_html=True)

    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown('<div class="chart-title">⚗️ Lead Optimization Pipeline</div>', unsafe_allow_html=True)

    max_cards = min(3, len(results))
    cols = st.columns(max_cards)
    for idx, result in enumerate(results[:max_cards]):
        with cols[idx]:
            st.markdown(
                f"""
            <div style="background-color: #f8f9fa; padding: 1rem; border-radius: 8px; text-align: center;">
                <h3 style="color: #1a237e; margin: 0;">{result["name"]}</h3>
                <p style="font-size: 2rem; font-weight: 600; color: #1976d2; margin: 0.5rem 0;">
                    {result["score"]:.0%}
                </p>
                <p style="color: #6c757d; font-size: 0.9rem;">
                    Bayesian P: {result["bayesian_probability"]:.1%}
                </p>
            </div>
            """,
                unsafe_allow_html=True,
            )

    st.markdown('</div>', unsafe_allow_html=True)

elif st.session_state.current_page == "Monte Carlo":
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown('<div class="chart-title">📈 Monte Carlo Simulations</div>', unsafe_allow_html=True)
    col1, col2, col3 = st.columns(3)
    with col1:
        n_simulations = st.number_input(
            "Number of Simulations",
            min_value=100,
            max_value=10000,
            value=1000,
            step=100,
        )
    with col2:
        confidence_level = st.slider("Confidence Level", 0.8, 0.99, 0.95, 0.01)
    with col3:
        selected_compound = st.selectbox(
            "Select Compound for Analysis",
            [r["name"] for r in results],
            index=0,
        )
    st.markdown('</div>', unsafe_allow_html=True)

    if st.button("🚀 Run Simulation", type="primary"):
        with st.spinner("Running Monte Carlo simulations..."):
            mc_results = run_monte_carlo_simulation(results, int(n_simulations), float(confidence_level))
            selected_mc = next(m for m in mc_results if m["name"] == selected_compound)
            compound_result = next(r for r in results if r["name"] == selected_compound)

            col1, col2 = st.columns(2)
            with col1:
                st.markdown('<div class="chart-container">', unsafe_allow_html=True)
                st.markdown('<div class="chart-title">📊 Simulation Distribution</div>', unsafe_allow_html=True)
                fig = px.histogram(
                    selected_mc["all_scores"],
                    nbins=50,
                    title=f"Score Distribution for {selected_compound}",
                    labels={"value": "Score", "count": "Frequency"},
                )
                fig.add_vline(x=compound_result["score"], line_dash="dash", line_color="red")
                st.plotly_chart(fig, use_container_width=True)
                st.markdown('</div>', unsafe_allow_html=True)

            with col2:
                st.markdown('<div class="chart-container">', unsafe_allow_html=True)
                st.markdown('<div class="chart-title">📈 Confidence Intervals</div>', unsafe_allow_html=True)
                fig = go.Figure()
                fig.add_trace(
                    go.Scatter(
                        x=[selected_compound],
                        y=[selected_mc["mean_score"]],
                        error_y={
                            "type": "data",
                            "symmetric": False,
                            "array": [selected_mc["ci_upper"] - selected_mc["mean_score"]],
                            "arrayminus": [selected_mc["mean_score"] - selected_mc["ci_lower"]],
                        },
                        mode="markers",
                        marker={"size": 20, "color": "#1a237e"},
                        name="Score",
                    )
                )
                fig.update_layout(
                    title=f"{confidence_level:.0%} Confidence Interval",
                    yaxis_range=[0, 1],
                    showlegend=False,
                )
                st.plotly_chart(fig, use_container_width=True)
                st.markdown('</div>', unsafe_allow_html=True)

            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.markdown(
                    f"""
                <div class="metric-card">
                    <div class="metric-value">{selected_mc["mean_score"]:.1%}</div>
                    <div class="metric-label">Mean Score</div>
                </div>
                """,
                    unsafe_allow_html=True,
                )
            with col2:
                st.markdown(
                    f"""
                <div class="metric-card">
                    <div class="metric-value">{selected_mc["std_dev"]:.1%}</div>
                    <div class="metric-label">Std Deviation</div>
                </div>
                """,
                    unsafe_allow_html=True,
                )
            with col3:
                st.markdown(
                    f"""
                <div class="metric-card">
                    <div class="metric-value">{selected_mc["ci_lower"]:.1%}</div>
                    <div class="metric-label">CI Lower Bound</div>
                </div>
                """,
                    unsafe_allow_html=True,
                )
            with col4:
                st.markdown(
                    f"""
                <div class="metric-card">
                    <div class="metric-value">{selected_mc["ci_upper"]:.1%}</div>
                    <div class="metric-label">CI Upper Bound</div>
                </div>
                """,
                    unsafe_allow_html=True,
                )

            st.markdown('<div class="chart-container">', unsafe_allow_html=True)
            st.markdown('<div class="chart-title">🎯 Success Probability Analysis</div>', unsafe_allow_html=True)
            comparison_df = pd.DataFrame(
                [
                    {
                        "Compound": m["name"],
                        "Success Probability": f'{m["success_probability"]:.1%}',
                        "Mean Score": f'{m["mean_score"]:.2%}',
                        "CI Lower": f'{m["ci_lower"]:.2%}',
                        "CI Upper": f'{m["ci_upper"]:.2%}',
                    }
                    for m in mc_results
                ]
            )
            st.dataframe(comparison_df, use_container_width=True, hide_index=True)
            st.markdown('</div>', unsafe_allow_html=True)

elif st.session_state.current_page == "Projects":
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown('<div class="chart-title">🧪 Active Projects</div>', unsafe_allow_html=True)
    for idx, result in enumerate(results[:4]):
        with st.expander(f'Project: {result["name"]} - Phase {idx + 1}'):
            col1, col2 = st.columns(2)
            with col1:
                st.metric("Overall Score", f'{result["score"]:.1%}')
                st.metric("Bayesian P(Success)", f'{result["bayesian_probability"]:.1%}')
            with col2:
                st.metric("Efficacy", f'{result["efficacy"]:.1%}')
                st.metric("Toxicity Risk", f'{result["toxicity"]:.1%}')
            st.markdown("**Agent Scores:**")
            agent_df = pd.DataFrame(
                [{"Agent": a.capitalize(), "Score": f"{s:.2%}"} for a, s in result["agents"].items()]
            )
            st.dataframe(agent_df, hide_index=True, use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

elif st.session_state.current_page == "Models":
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown('<div class="chart-title">🤖 Agent Models</div>', unsafe_allow_html=True)
    agents = {
        "Scout Agent": "Efficacy opportunity analysis with property-based adjustments",
        "Safety Agent": "Toxicity risk assessment with detailed toxicity profiling",
        "Strategy Agent": "Feasibility balancing and development path optimization",
        "Challenge Agent": "Contradiction detection and critical flagging",
    }
    for agent, description in agents.items():
        with st.container():
            st.markdown(
                f"""
            <div style="background-color: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <h4 style="color: #1a237e; margin: 0;">{agent}</h4>
                <p style="color: #6c757d; margin: 0.5rem 0;">{description}</p>
            </div>
            """,
                unsafe_allow_html=True,
            )
    st.markdown('</div>', unsafe_allow_html=True)

elif st.session_state.current_page == "Reports":
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown('<div class="chart-title">📋 Generate Reports</div>', unsafe_allow_html=True)
    col1, col2 = st.columns(2)
    with col1:
        report_type = st.selectbox(
            "Report Type",
            ["Full Analysis Report", "Compound Rankings", "Monte Carlo Results", "Agent Performance"],
        )
        today = datetime.now().date()
        date_range = st.date_input("Date Range", (today, today))

    with col2:
        include_visualizations = st.checkbox("Include Visualizations", True)
        include_raw_data = st.checkbox("Include Raw Data", False)
        export_format = st.selectbox("Export Format", ["CSV", "JSON", "PDF"])

    if st.button("Generate Report", type="primary"):
        st.success(f"Report generated successfully! ({report_type})")
        report_df = pd.DataFrame(results)
        payload: str
        mime: str
        file_ext: str

        if export_format == "CSV":
            payload = report_df.to_csv(index=False)
            mime = "text/csv"
            file_ext = "csv"
        elif export_format == "JSON":
            payload = report_df.to_json(orient="records", indent=2)
            mime = "application/json"
            file_ext = "json"
        else:
            # PDF generation is represented as text in this demo.
            payload = (
                "PHOENIX Report (demo)\n"
                f"Type: {report_type}\n"
                f"Date Range: {date_range}\n"
                f"Include Visualizations: {include_visualizations}\n"
                f"Include Raw Data: {include_raw_data}\n"
                f"Records: {len(report_df)}\n"
            )
            mime = "text/plain"
            file_ext = "txt"
            st.info("PDF export is not enabled in this demo. Downloading a text summary instead.")

        metadata = {
            "report_type": report_type,
            "date_range": [str(d) for d in date_range] if isinstance(date_range, tuple) else str(date_range),
            "include_visualizations": include_visualizations,
            "include_raw_data": include_raw_data,
        }
        if include_raw_data:
            payload = payload + "\n\n" + json.dumps(metadata, indent=2)

        st.download_button(
            label="📥 Download Report",
            data=payload,
            file_name=f'phoenix_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.{file_ext}',
            mime=mime,
        )
    st.markdown('</div>', unsafe_allow_html=True)

st.markdown("---")
st.markdown(
    "<div style='text-align: center; color: #6c757d; font-size: 0.8rem;'>"
    "PHOENIX v2.0 - Multi-Agent Decision Intelligence Platform for Drug Discovery"
    "</div>",
    unsafe_allow_html=True,
)
