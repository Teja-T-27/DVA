import React, { useState, useCallback } from "react";
import Sidebar           from "./components/Sidebar/Sidebar";
import RiskCard          from "./components/RiskCard/RiskCard";
import ShapChart         from "./components/ShapChart/ShapChart";
import Suggestions       from "./components/Suggestions/Suggestions";
import ModelMetrics      from "./components/ModelMetrics/ModelMetrics";
import CompareProfiles   from "./components/CompareProfiles/CompareProfiles";
import ClinicalBenchmark from "./components/ClinicalBenchmark/ClinicalBenchmark";
import ErrorBoundary     from "./components/ErrorBoundary/ErrorBoundary";
import useModel          from "./hooks/useModel";
import { CONDITIONS, DEFAULT_FEATURES, getRiskLevel } from "./utils/constants";
import "./App.css";

const TABS = [
    { key: "dashboard", label: "Dashboard" },
    { key: "metrics",   label: "Model Info" },
];

export default function App() {
    const [features,      setFeatures]      = useState(DEFAULT_FEATURES);
    const [selectedIdx,   setSelectedIdx]   = useState(0);
    const [activeTab,     setActiveTab]     = useState("dashboard");
    const [hasInteracted, setHasInteracted] = useState(false);
    const [savedProfile,  setSavedProfile]  = useState(null);
    const [savedRisks,    setSavedRisks]    = useState(null);
    const [savedLabel,    setSavedLabel]    = useState("");

    const { data, loading, error } = useModel(hasInteracted ? features : null);

    const handleFeaturesChange = useCallback((next) => {
        setFeatures(next);
        setHasInteracted(true);
    }, []);

    const selectedCondition = CONDITIONS[selectedIdx];
    const risks      = data?.risks || null;
    const shapValues = data?.shap  || null;

    const selectedRisk  = risks ? (risks[selectedCondition.key] || 0) * 100 : 0;
    const selectedShap  = shapValues ? shapValues[selectedCondition.key] : null;
    const selectedLevel = getRiskLevel(selectedRisk);

    return (
        <div className="app-root">
            <header className="topbar">
                <span className="topbar-title">Behind the Numbers: What Your Lifestyle Reveals</span>
                <nav className="topbar-tabs">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            className={`topbar-tab ${activeTab === t.key ? "topbar-tab--active" : ""}`}
                            onClick={() => setActiveTab(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </nav>
            </header>

            <div className="app-shell">
                <Sidebar features={features} onChange={handleFeaturesChange} />

                <main className="main-panel">
                    <ErrorBoundary>

                        {/* ── DASHBOARD ── */}
                        {activeTab === "dashboard" && (
                            <>
                                {!hasInteracted && (
                                    <div className="empty-state">
                                        <h2>Adjust inputs to simulate your health risk</h2>
                                        <p>Use the sliders on the left to explore how lifestyle factors impact your risk across 5 conditions.</p>
                                    </div>
                                )}

                                {hasInteracted && (
                                    <>
                                        <div className="risk-cards-grid">
                                            {CONDITIONS.map((cond, i) => (
                                                <RiskCard
                                                    key={cond.key}
                                                    condition={cond}
                                                    score={(risks?.[cond.key] || 0) * 100}
                                                    selected={selectedIdx === i}
                                                    onClick={() => setSelectedIdx(i)}
                                                />
                                            ))}
                                        </div>

                                        <p className="cards-hint">Click each condition card to see detailed insights and clinical benchmarks</p>

                                        {error && <div className="backend-error">⚠ {error}</div>}

                                        {loading && (
                                            <div className="loader-container">
                                                <div className="loader" />
                                                <p>Analysing your health risk...</p>
                                            </div>
                                        )}

                                        {!loading && risks && (
                                            <div className="detail-section">
                                                <div className="detail-header">
                                                    <h2 className="detail-title">
                                                        {selectedCondition.icon} {selectedCondition.label}
                                                        <span className={`detail-score detail-score--${selectedLevel}`}>
                                                            {selectedRisk.toFixed(1)}%
                                                        </span>
                                                    </h2>
                                                </div>

                                                <div className="detail-body">
                                                    <div className="detail-left">
                                                        <div className="panel-block">
                                                            <p className="panel-eyebrow">Actionable lifestyle suggestions</p>
                                                            <Suggestions shapValues={selectedShap} features={features} />
                                                            <ClinicalBenchmark features={features} conditionKey={selectedCondition.key} />
                                                        </div>

                                                        <div className="panel-block">
                                                            <p className="panel-eyebrow">Feature impact (SHAP values)</p>
                                                            <ShapChart shapValues={selectedShap} />
                                                        </div>

                                                        <div className="disclaimer">
                                                            * This is a predictive model and not a substitute for professional medical advice. Always consult a doctor for health-related decisions.
                                                        </div>
                                                    </div>

                                                    <div className="detail-right">
                                                        <div className="panel-block">
                                                            <p className="panel-eyebrow">Compare profiles</p>
                                                            <CompareProfiles
                                                                currentFeatures={features}
                                                                currentRisks={risks}
                                                                savedProfile={savedProfile}
                                                                savedRisks={savedRisks}
                                                                savedLabel={savedLabel}
                                                                onSave={(f, r, l) => { setSavedProfile(f); setSavedRisks(r); setSavedLabel(l); }}
                                                                onClear={() => { setSavedProfile(null); setSavedRisks(null); }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}

                        {/* ── MODEL INFO ── */}
                        {activeTab === "metrics" && <ModelMetrics />}

                    </ErrorBoundary>
                </main>
            </div>
        </div>
    );
}
