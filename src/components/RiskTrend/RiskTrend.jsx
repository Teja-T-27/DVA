import React, { useState, useEffect, useRef } from "react";
import { FEATURE_LABELS, SELECTED_FEATURES, CONDITIONS, BACKEND_URL } from "../../utils/constants";
import "./RiskTrend.css";

const SWEEP_FEATURES = [
    { key: "age",                           min: 20, max: 80, step: 5,   label: "Age" },
    { key: "bmi",                           min: 18, max: 45, step: 1,   label: "BMI" },
    { key: "waist_cm",                      min: 60, max: 130, step: 5,  label: "Waist (cm)" },
    { key: "sleep_hours_weekday",           min: 4,  max: 10, step: 0.5, label: "Sleep (hrs)" },
    { key: "sedentary_minutes_per_day",     min: 0,  max: 840, step: 60, label: "Sedentary (mins)" },
    { key: "days_physically_active_past_30",min: 0,  max: 7,  step: 1,   label: "Active Days" },
    { key: "avg_drinks_per_day",            min: 0,  max: 8,  step: 1,   label: "Alcohol (drinks/day)" },
];

export default function RiskTrend({ baseFeatures, selectedCondition }) {
    const [sweepFeature, setSweepFeature] = useState("bmi");
    const [trendData,    setTrendData]    = useState(null);
    const [loading,      setLoading]      = useState(false);
    const canvasRef = useRef(null);

    const sweep = SWEEP_FEATURES.find(f => f.key === sweepFeature);

    useEffect(() => {
        if (!baseFeatures) return;

        const run = async () => {
            setLoading(true);
            const points = [];
            for (let val = sweep.min; val <= sweep.max; val += sweep.step) {
                const feat = { ...baseFeatures, [sweepFeature]: val };
                try {
                    const res = await fetch(`${BACKEND_URL}/predict`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(feat),
                    });
                    const data = await res.json();
                    points.push({ x: val, risks: data.risks });
                } catch { break; }
            }
            setTrendData(points);
            setLoading(false);
        };

        run();
    }, [sweepFeature, baseFeatures]);

    // draw canvas chart
    useEffect(() => {
        if (!trendData || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx    = canvas.getContext("2d");
        const W = canvas.width;
        const H = canvas.height;
        const PAD = { top: 20, right: 20, bottom: 40, left: 50 };

        ctx.clearRect(0, 0, W, H);

        const COLORS = {
            diabetes:     "#E85050",
            hypertension: "#E89830",
            depression:   "#9B59B6",
            cvd:          "#E74C3C",
            fatty_liver:  "#2ECC71",
        };

        const xs     = trendData.map(p => p.x);
        const minX   = Math.min(...xs);
        const maxX   = Math.max(...xs);
        const toCanX = x => PAD.left + ((x - minX) / (maxX - minX || 1)) * (W - PAD.left - PAD.right);
        const toCanY = y => PAD.top  + (1 - y) * (H - PAD.top - PAD.bottom);

        // grid lines
        ctx.strokeStyle = "#e0e0e0";
        ctx.lineWidth = 1;
        [0, 0.25, 0.5, 0.75, 1].forEach(v => {
            ctx.beginPath();
            ctx.moveTo(PAD.left, toCanY(v));
            ctx.lineTo(W - PAD.right, toCanY(v));
            ctx.stroke();
            ctx.fillStyle = "#888";
            ctx.font = "10px sans-serif";
            ctx.fillText(`${Math.round(v * 100)}%`, 4, toCanY(v) + 4);
        });

        // x axis labels
        ctx.fillStyle = "#888";
        ctx.font = "10px sans-serif";
        ctx.textAlign = "center";
        trendData.filter((_, i) => i % 2 === 0).forEach(p => {
            ctx.fillText(p.x, toCanX(p.x), H - 8);
        });

        // lines
        CONDITIONS.forEach(c => {
            if (c.key !== selectedCondition && selectedCondition !== "all") return;
            ctx.strokeStyle = COLORS[c.key] || "#888";
            ctx.lineWidth   = 2;
            ctx.beginPath();
            trendData.forEach((p, i) => {
                const x = toCanX(p.x);
                const y = toCanY(p.risks[c.key] || 0);
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
            });
            ctx.stroke();
        });

        // x axis label
        ctx.fillStyle = "#555";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(sweep.label, W / 2, H - 2);

    }, [trendData, selectedCondition]);

    return (
        <div className="risk-trend">
            <div className="rt-controls">
                <label className="rt-label">Sweep feature:</label>
                <select
                    className="rt-select"
                    value={sweepFeature}
                    onChange={e => setSweepFeature(e.target.value)}
                >
                    {SWEEP_FEATURES.map(f => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                    ))}
                </select>
            </div>
            {loading && <div className="rt-loading">Calculating trend...</div>}
            {!loading && trendData && (
                <canvas ref={canvasRef} width={500} height={220} className="rt-canvas" />
            )}
            {!loading && !trendData && (
                <div className="rt-empty">Adjust a slider to see how it affects your risk.</div>
            )}
        </div>
    );
}
