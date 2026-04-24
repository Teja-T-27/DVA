import React, { useState } from "react";
import useMetrics from "../../hooks/useMetrics";
import { CONDITIONS, FEATURE_LABELS } from "../../utils/constants";
import "./ModelMetrics.css";

const CONDITION_LABELS = Object.fromEntries(CONDITIONS.map(c => [c.key, c.label]));

export default function ModelMetrics() {
    const { metrics, loading, error } = useMetrics();
    const [selected, setSelected] = useState("diabetes");

    if (loading) return <div className="mm-loading"><div className="loader" /><p>Loading model metrics...</p></div>;
    if (error)   return <div className="mm-error">{error}</div>;
    if (!metrics) return null;

    const condition = metrics[selected];

    return (
        <div className="model-metrics">
            <div className="mm-header">
                <h2 className="mm-title">Model Performance</h2>
                <p className="mm-subtitle">
                    Trained on NHANES 2015–2023 · {Object.keys(metrics).length} conditions ·
                    XGBoost with survey-weighted training
                </p>
            </div>

            {/* AUC summary cards */}
            <div className="mm-auc-grid">
                {CONDITIONS.map(c => {
                    const m = metrics[c.key];
                    const auc = m?.auc;
                    const meets = auc >= 0.80;
                    return (
                        <button
                            key={c.key}
                            className={`mm-auc-card ${selected === c.key ? "mm-auc-card--selected" : ""} ${meets ? "" : "mm-auc-card--warn"}`}
                            onClick={() => setSelected(c.key)}
                        >
                            <div className="mm-auc-label">{c.icon} {c.label}</div>
                            <div className="mm-auc-value">{auc ? auc.toFixed(3) : "—"}</div>
                            <div className={`mm-auc-badge ${meets ? "mm-auc-badge--ok" : "mm-auc-badge--miss"}`}>
                                {meets ? "✓ ≥ 0.80" : "Below target"}
                            </div>
                            <div className="mm-auc-bar-track">
                                <div className="mm-auc-bar-fill" style={{ width: `${Math.min((auc || 0) * 100, 100)}%` }} />
                                <div className="mm-auc-target-line" />
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Top features for selected condition */}
            <div className="mm-features">
                <h3 className="mm-features-title">
                    Top predictive features — {CONDITION_LABELS[selected]}
                </h3>
                <p className="mm-features-sub">Feature importance scores from XGBoost ({condition?.n_features} total features used)</p>
                <div className="mm-feat-list">
                    {(condition?.top_features || []).map((f, i) => (
                        <div key={f.feature} className="mm-feat-row">
                            <span className="mm-feat-rank">#{i + 1}</span>
                            <span className="mm-feat-name">{FEATURE_LABELS[f.feature] || f.feature}</span>
                            <div className="mm-feat-bar-track">
                                <div
                                    className="mm-feat-bar-fill"
                                    style={{ width: `${(f.importance / condition.top_features[0].importance) * 100}%` }}
                                />
                            </div>
                            <span className="mm-feat-score">{(f.importance * 100).toFixed(1)}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Dataset info */}
            <div className="mm-dataset">
                <h3 className="mm-dataset-title">Dataset</h3>
                <div className="mm-dataset-grid">
                    <div className="mm-stat"><div className="mm-stat-val">31,158</div><div className="mm-stat-label">Participants</div></div>
                    <div className="mm-stat"><div className="mm-stat-val">154</div><div className="mm-stat-label">Features</div></div>
                    <div className="mm-stat"><div className="mm-stat-val">3</div><div className="mm-stat-label">NHANES Cycles</div></div>
                    <div className="mm-stat"><div className="mm-stat-val">5</div><div className="mm-stat-label">Conditions</div></div>
                </div>
                <p className="mm-note">
                    Models trained with survey weights to ensure national representativeness.
                    Depression label derived from PHQ-9 score ≥ 10 (clinical threshold).
                    Cardiovascular risk combines coronary heart disease, heart attack, stroke, and congestive heart failure.
                </p>
            </div>
        </div>
    );
}
