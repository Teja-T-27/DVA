import React, { useState } from "react";
import "./Sidebar.css";

function CheckboxGroup({ label, options, value, onChange }) {
    return (
        <div className="checkbox-group">
            {label && <div className="checkbox-label">{label}</div>}
            <div className="checkbox-options">
                {options.map((opt) => (
                    <label key={opt.value} className="checkbox-option">
                        <input
                            type="checkbox"
                            checked={value === opt.value}
                            onChange={() => onChange(opt.value)}
                        />
                        <span>{opt.label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}

function SliderRow({ label, value, min, max, step = 1, unit = "", onChange }) {
    const display = typeof value === "number"
        ? step < 1 ? value.toFixed(1) : Math.round(value)
        : value;
    return (
        <div className="slider-row">
            <div className="slider-label">
                <span className="slider-name">{label}</span>
                <span className="slider-val">{display}{unit}</span>
            </div>
            <input
                type="range" min={min} max={max} step={step} value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="slider-input"
                style={{
                    background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${((value - min) / (max - min)) * 100}%, #e0e0e0 ${((value - min) / (max - min)) * 100}%, #e0e0e0 100%)`
                }}
            />
        </div>
    );
}

function ToggleRow({ label, value, onChange }) {
    return (
        <div className="toggle-row">
            <label className="toggle-label">{label}</label>
            <label className="toggle-switch">
                <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked ? 1 : 0)} />
                <span className="toggle-track"><span className="toggle-thumb" /></span>
            </label>
        </div>
    );
}

function SelectRow({ label, value, options, onChange }) {
    return (
        <div className="slider-row">
            <div className="slider-label">
                <span className="slider-name">{label}</span>
            </div>
            <select value={value} onChange={(e) => onChange(e.target.value)} className="select-input">
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

function SectionHeading({ children }) {
    return <div className="sidebar-section-heading">{children}</div>;
}

function SectionHint({ children }) {
    return <p className="sidebar-section-hint">{children}</p>;
}

export default function Sidebar({ features, onChange }) {
    const [unit, setUnit] = useState("metric");

    const kgToLbs = (kg) => Math.round(kg * 2.20462);
    const lbsToKg = (lbs) => lbs / 2.20462;
    const cmToIn  = (cm) => (cm * 0.393701).toFixed(1);
    const inToCm  = (inch) => inch / 0.393701;

    const set = (key) => (val) => {
        const next = { ...features, [key]: val };
        // auto-derive BMI from weight and height
        const w = next.weight_kg;
        const h = next.height_cm / 100;
        if (w && h) next.bmi = parseFloat((w / (h * h)).toFixed(1));
        // auto-derive short/long sleep
        const sleep = next.sleep_hours_weekday;
        next.short_sleep = sleep < 6 ? 1 : 0;
        next.long_sleep  = sleep > 9 ? 1 : 0;
        onChange(next);
    };

    const bmi = (features.weight_kg / Math.pow(features.height_cm / 100, 2)).toFixed(1);
    const bmiCategory = bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese";

    return (
        <aside className="sidebar">
            <div className="sidebar-inner">
                <div className="sidebar-top">
                    <span className="sidebar-brand">Lifestyle Inputs</span>
                    <span className="sidebar-hint">Adjust sliders to simulate your risk</span>
                </div>

                {/* ── Demographics ── */}
                <section className="sidebar-section">
                    <SectionHeading>Demographics</SectionHeading>
                    <SliderRow label="Age" value={features.age} min={18} max={85} unit=" yrs" onChange={set("age")} />
                    <CheckboxGroup
                        label="Gender" value={features.gender} onChange={set("gender")}
                        options={[{ label: "Male", value: "Male" }, { label: "Female", value: "Female" }]}
                    />
                    <div className="unit-toggle">
                        <button className={`unit-btn ${unit === "metric" ? "active" : ""}`} onClick={() => setUnit("metric")}>kg / cm</button>
                        <button className={`unit-btn ${unit === "imperial" ? "active" : ""}`} onClick={() => setUnit("imperial")}>lbs / in</button>
                    </div>
                    <SliderRow
                        label="Weight"
                        value={unit === "metric" ? features.weight_kg : kgToLbs(features.weight_kg)}
                        min={unit === "metric" ? 30 : 66} max={unit === "metric" ? 150 : 330}
                        unit={unit === "metric" ? " kg" : " lbs"}
                        onChange={(val) => set("weight_kg")(unit === "metric" ? val : lbsToKg(val))}
                    />
                    <SliderRow
                        label="Height"
                        value={unit === "metric" ? features.height_cm : cmToIn(features.height_cm)}
                        min={unit === "metric" ? 140 : 55} max={unit === "metric" ? 210 : 83}
                        step={unit === "metric" ? 1 : 0.5}
                        unit={unit === "metric" ? " cm" : " in"}
                        onChange={(val) => set("height_cm")(unit === "metric" ? val : inToCm(val))}
                    />
                    <div className="bmi-display">
                        <span className="bmi-label">BMI (calculated)</span>
                        <span className="bmi-value">{bmi} <span className="bmi-cat">— {bmiCategory}</span></span>
                    </div>
                    <SliderRow
                        label="Waist"
                        value={unit === "metric" ? features.waist_cm : cmToIn(features.waist_cm)}
                        min={unit === "metric" ? 55 : 21} max={unit === "metric" ? 140 : 55}
                        step={0.5} unit={unit === "metric" ? " cm" : " in"}
                        onChange={(val) => set("waist_cm")(unit === "metric" ? val : inToCm(val))}
                    />
                    <SelectRow
                        label="General Health" value={features.general_health_self_report}
                        onChange={set("general_health_self_report")}
                        options={[
                            { label: "Excellent", value: "Excellent" },
                            { label: "Very Good", value: "Very good" },
                            { label: "Good",      value: "Good"      },
                            { label: "Fair",      value: "Fair"      },
                            { label: "Poor",      value: "Poor"      },
                        ]}
                    />
                </section>

                {/* ── Sleep ── */}
                <section className="sidebar-section">
                    <SectionHeading>Sleep</SectionHeading>
                    <SectionHint>Recommended: 7–9 hrs/night for adults</SectionHint>
                    <SliderRow label="Sleep Duration" value={features.sleep_hours_weekday} min={3} max={12} step={0.5} unit=" hrs" onChange={set("sleep_hours_weekday")} />
                </section>

                {/* ── Activity ── */}
                <section className="sidebar-section">
                    <SectionHeading>Activity</SectionHeading>
                    <SectionHint>WHO recommends limiting prolonged sitting</SectionHint>
                    <SliderRow label="Sedentary Hours" value={features.sedentary_minutes_per_day / 60} min={0} max={16} step={0.5} unit=" hrs/day" onChange={(val) => set("sedentary_minutes_per_day")(val * 60)} />
                </section>

                {/* ── Diet ── */}
                <section className="sidebar-section">
                    <SectionHeading>Diet (typical day)</SectionHeading>
                    <SectionHint>Based on a typical day's intake</SectionHint>
                    <SliderRow label="Calories"  value={features.day1_calories}      min={800}  max={4000} step={50} unit=" kcal" onChange={set("day1_calories")} />
                    <SliderRow label="Protein"   value={features.day1_protein_g}     min={20}   max={200}            unit=" g"    onChange={set("day1_protein_g")} />
                    <SliderRow label="Sugar"     value={features.day1_total_sugar_g} min={0}    max={200}            unit=" g"    onChange={set("day1_total_sugar_g")} />
                    <SliderRow label="Caffeine"  value={features.day1_caffeine_mg}   min={0}    max={600} step={10}  unit=" mg"   onChange={set("day1_caffeine_mg")} />
                </section>

                {/* ── Behaviour ── */}
                <section className="sidebar-section">
                    <SectionHeading>Behaviour</SectionHeading>
                    <ToggleRow label="Current Tobacco Use" value={features.any_tobacco_use} onChange={set("any_tobacco_use")} />
                    <CheckboxGroup
                        label="Smoked 100+ cigarettes (lifetime)"
                        value={features.smoked_100_cigarettes_lifetime}
                        onChange={set("smoked_100_cigarettes_lifetime")}
                        options={[{ label: "No", value: "No" }, { label: "Yes", value: "Yes" }]}
                    />
                    <SelectRow
                        label="Current Smoker" value={features.current_smoker}
                        onChange={set("current_smoker")}
                        options={[
                            { label: "Not at all", value: "Not at all" },
                            { label: "Some days",  value: "Some days"  },
                            { label: "Every day",  value: "Every day"  },
                        ]}
                    />
                    <CheckboxGroup
                        label="Binge drinking (past year)"
                        value={features.binge_drinking_past_year}
                        onChange={set("binge_drinking_past_year")}
                        options={[{ label: "No", value: "No" }, { label: "Yes", value: "Yes" }]}
                    />
                </section>

                {/* ── Healthcare & Lifestyle ── */}
                <section className="sidebar-section">
                    <SectionHeading>Healthcare & Lifestyle</SectionHeading>
                    <CheckboxGroup
                        label="Health Insurance"
                        value={features.has_health_insurance}
                        onChange={set("has_health_insurance")}
                        options={[{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }]}
                    />
                    <SelectRow
                        label="Regular Care Place" value={features.routine_care_place}
                        onChange={set("routine_care_place")}
                        options={[
                            { label: "Yes",           value: "Yes"               },
                            { label: "More than one", value: "More than one place"},
                            { label: "No",            value: "There is no place" },
                        ]}
                    />
                    <CheckboxGroup
                        label="Tried to lose weight (past year)"
                        value={features.tried_to_lose_weight_past_year}
                        onChange={set("tried_to_lose_weight_past_year")}
                        options={[{ label: "No", value: "No" }, { label: "Yes", value: "Yes" }]}
                    />
                </section>

                {/* ── Food Security ── */}
                <section className="sidebar-section">
                    <SectionHeading>Food Security</SectionHeading>
                    <SelectRow
                        label="Food Security Level" value={features.adult_food_security}
                        onChange={set("adult_food_security")}
                        options={[
                            { label: "Full security",     value: "Full security"     },
                            { label: "Marginal security", value: "Marginal security" },
                            { label: "Low security",      value: "Low security"      },
                            { label: "Very low security", value: "Very low security" },
                        ]}
                    />
                </section>

                {/* ── Mental Health ── */}
                <section className="sidebar-section">
                    <SectionHeading>Mental Health (past 2 weeks)</SectionHeading>
                    <SectionHint>0 = Not at all · 1 = Several days · 2 = More than half · 3 = Nearly every day</SectionHint>
                    <SliderRow label="Little Interest or Pleasure" value={features.phq_little_interest}        min={0} max={3} step={1} onChange={set("phq_little_interest")} />
                    <SliderRow label="Feeling Down or Hopeless"    value={features.phq_feeling_down}           min={0} max={3} step={1} onChange={set("phq_feeling_down")} />
                    <SliderRow label="Sleep Problems"              value={features.phq_sleep_problems}         min={0} max={3} step={1} onChange={set("phq_sleep_problems")} />
                    <SliderRow label="Fatigue / Low Energy"        value={features.phq_tired}                  min={0} max={3} step={1} onChange={set("phq_tired")} />
                    <SliderRow label="Poor Appetite"               value={features.phq_poor_appetite}          min={0} max={3} step={1} onChange={set("phq_poor_appetite")} />
                    <SliderRow label="Feeling Bad About Self"      value={features.phq_feeling_bad_about_self} min={0} max={3} step={1} onChange={set("phq_feeling_bad_about_self")} />
                    <SliderRow label="Trouble Concentrating"       value={features.phq_trouble_concentrating}  min={0} max={3} step={1} onChange={set("phq_trouble_concentrating")} />
                    <SliderRow label="Moving or Speaking Slowly"   value={features.phq_moving_slowly}         min={0} max={3} step={1} onChange={set("phq_moving_slowly")} />
                    <SliderRow label="Thoughts of Self-Harm"       value={features.phq_thoughts_of_harm}       min={0} max={3} step={1} onChange={set("phq_thoughts_of_harm")} />
                </section>

            </div>
        </aside>
    );
}
