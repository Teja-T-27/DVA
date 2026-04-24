import React from "react";
import { adaDiabetesScore, ascvdRisk, phq9Severity } from "../../utils/clinicalScores";
import "./ClinicalBenchmark.css";

const LEVEL_CLASS = {
    "Low":          "bench--low",
    "Moderate":     "bench--moderate",
    "Borderline-High": "bench--moderate",
    "High":         "bench--high",
    "Mild":         "bench--low",
    "Minimal/None": "bench--low",
    "Mod-Severe":   "bench--high",
    "Severe":       "bench--high",
};

function BenchmarkRow({ label, value, level, source, caveat }) {
    return (
        <div className="bench-row">
            <div className="bench-left">
                <span className="bench-label">{label}</span>
                <span className="bench-source">{source}</span>
                {caveat && <span className="bench-caveat">* {caveat}</span>}
            </div>
            <div className={`bench-badge ${LEVEL_CLASS[level] || "bench--low"}`}>
                {value}
            </div>
        </div>
    );
}

export default function ClinicalBenchmark({ features, conditionKey }) {
    if (!features) return null;

    if (conditionKey === "diabetes") {
        const result = adaDiabetesScore(features);
        return (
            <div className="clinical-benchmark">
                <p className="bench-title">Clinical Reference</p>
                <BenchmarkRow
                    label="ADA Diabetes Risk"
                    value={`${result.level} (${result.score}/${result.maxScore})`}
                    level={result.level}
                    source={result.source}
                />
                <p className="bench-desc">{result.description}</p>
            </div>
        );
    }

    if (conditionKey === "cvd") {
        const result = ascvdRisk(features);
        return (
            <div className="clinical-benchmark">
                <p className="bench-title">Clinical Reference</p>
                <BenchmarkRow
                    label="10-Year CVD Risk"
                    value={`${result.pct}% (${result.level})`}
                    level={result.level}
                    source={result.source}
                    caveat={result.caveat}
                />
                <p className="bench-desc">{result.description}</p>
            </div>
        );
    }

    if (conditionKey === "depression") {
        const result = phq9Severity(features);
        return (
            <div className="clinical-benchmark">
                <p className="bench-title">Clinical Reference</p>
                <BenchmarkRow
                    label="PHQ-9 Severity"
                    value={`${result.level} (est. ${result.score}/27)`}
                    level={result.level}
                    source={result.source}
                    caveat={result.caveat}
                />
                <p className="bench-desc">{result.description}</p>
            </div>
        );
    }

    return null;
}
