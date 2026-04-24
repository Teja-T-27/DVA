import React from "react";
import { CONDITIONS, getRiskLevel } from "../../utils/constants";
import "./CompareProfiles.css";

export default function CompareProfiles({
    currentFeatures, currentRisks,
    savedProfile, savedRisks, savedLabel,
    onSave, onClear
}) {
    if (!currentRisks) {
        return (
            <div className="compare-empty">
                <p>Adjust the sliders to generate a risk profile, then save it here to compare.</p>
            </div>
        );
    }

    const handleSave = () => {
        onSave(
            { ...currentFeatures },
            { ...currentRisks },
            new Date().toLocaleTimeString()
        );
    };

    return (
        <div className="compare">
            <div className="compare-actions">
                <button className="compare-btn compare-btn--save" onClick={handleSave}>
                    📌 Save current profile
                </button>
                {savedProfile && (
                    <button className="compare-btn compare-btn--clear" onClick={onClear}>
                        ✕ Clear saved
                    </button>
                )}
            </div>

            {!savedProfile && (
                <div className="compare-hint">
                    Adjust sliders to a new profile, then save to compare before vs after.
                </div>
            )}

            {savedProfile && (
                <div className="compare-grid">
                    <div className="compare-col-header" />
                    <div className="compare-col-header">Saved ({savedLabel})</div>
                    <div className="compare-col-header">Current</div>
                    <div className="compare-col-header">Change</div>

                    {CONDITIONS.map(c => {
                        const saved   = (savedRisks[c.key]   || 0) * 100;
                        const current = (currentRisks[c.key] || 0) * 100;
                        const diff    = current - saved;
                        const diffClass = diff > 1 ? "compare-diff--worse" : diff < -1 ? "compare-diff--better" : "compare-diff--same";

                        return (
                            <React.Fragment key={c.key}>
                                <div className="compare-label">{c.icon} {c.label}</div>
                                <div className={`compare-val compare-val--${getRiskLevel(saved)}`}>{saved.toFixed(1)}%</div>
                                <div className={`compare-val compare-val--${getRiskLevel(current)}`}>{current.toFixed(1)}%</div>
                                <div className={`compare-diff ${diffClass}`}>
                                    {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
