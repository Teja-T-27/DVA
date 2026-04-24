import React from "react";
import { FEATURE_LABELS, SELECTED_FEATURES } from "../../utils/constants";
import "./ShapChart.css";

export default function ShapChart({ shapValues }) {
    if (!shapValues) return <div className="shap-empty">No data yet.</div>;

    const sorted = Object.entries(shapValues)
        .filter(([feat]) => SELECTED_FEATURES.includes(feat))
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, 10);

    if (sorted.length === 0) return <div className="shap-empty">No user-controllable features found.</div>;

    const maxAbs = Math.max(...sorted.map(([, v]) => Math.abs(v)), 0.001);

    return (
        <div className="shap-chart">
            <div className="shap-axis-labels">
                <span className="shap-axis-neg">◀ lowers risk</span>
                <span className="shap-axis-pos">raises risk ▶</span>
            </div>
            {sorted.map(([feat, val], i) => {
                const isPos  = val >= 0;
                const barPct = (Math.abs(val) / maxAbs) * 44;
                return (
                    <div className="shap-row" key={feat} style={{ animationDelay: `${i * 0.04}s` }}>
                        <span className="shap-feat-label" title={FEATURE_LABELS[feat] || feat}>
                            {FEATURE_LABELS[feat] || feat}
                        </span>
                        <div className="shap-bar-wrap">
                            <div className="shap-center-line" />
                            <div
                                className={`shap-bar ${isPos ? "shap-bar--pos" : "shap-bar--neg"}`}
                                style={{ width: `${barPct}%`, left: isPos ? "50%" : `${50 - barPct}%` }}
                            />
                        </div>
                        <span className={`shap-val ${isPos ? "shap-val--pos" : "shap-val--neg"}`}>
                            {isPos ? "+" : ""}{(val * 100).toFixed(1)}%
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
