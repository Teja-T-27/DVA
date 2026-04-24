import React from "react";
import { getRiskLevel, getRiskLabel } from "../../utils/constants";
import "./RiskCard.css";

export default function RiskCard({ condition, score, selected, onClick }) {
    const level = getRiskLevel(score);
    const label = getRiskLabel(score);

    return (
        <button
            className={`risk-card risk-card--${level}${selected ? " risk-card--selected" : ""}`}
            onClick={onClick}
            aria-pressed={selected}
        >
            <div className="risk-card__icon">{condition.icon}</div>
            <div className="risk-card__name">{condition.label}</div>
            <div className="risk-card__score">
                {score.toFixed(0)}<span className="risk-card__pct">%</span>
            </div>
            <div className={`risk-card__badge risk-card__badge--${level}`}>{label}</div>
            <div className="risk-card__bar-track">
                <div className="risk-card__bar-fill" style={{ width: `${Math.min(score, 100)}%` }} />
            </div>
        </button>
    );
}
