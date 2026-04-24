import React from "react";
import { FEATURE_LABELS, SELECTED_FEATURES } from "../../utils/constants";
import "./Suggestions.css";

// ─────────────────────────────────────────────────────────────
// CLINICAL GUIDELINES (used for value-based suggestions)
// ─────────────────────────────────────────────────────────────
const GUIDELINES = {
    sleep:    { min: 7, max: 9, unit: "hrs", label: "7–9 hrs recommended for adults" },
    sedentary:{ max: 480, unit: "mins", label: "limit prolonged sitting (WHO)" },
    sugar:    { max: 50, unit: "g", label: "WHO recommends <50g/day" },
    calories: { min: 1600, max: 2400, unit: "kcal", label: "1,600–2,400 kcal typical range" },
    protein:  { min: 50, unit: "g", label: "0.8g/kg body weight recommended" },
    caffeine: { max: 400, unit: "mg", label: "FDA safe limit: 400mg/day" },
};

// ─────────────────────────────────────────────────────────────
// VALUE-BASED SUGGESTIONS
// These use actual input values + clinical guidelines
// NOT SHAP sign (which can be wrong due to cross-sectional data)
// ─────────────────────────────────────────────────────────────
function getValueBasedSuggestions(features) {
    const suggestions = [];

    // Sleep
    if (features.sleep_hours_weekday < 6) {
        suggestions.push({
            feature: "sleep_hours_weekday",
            text: `You're getting ${features.sleep_hours_weekday} hrs of sleep — below the recommended 7–9 hrs for adults. Poor sleep is linked to higher risk of diabetes, depression, and cardiovascular disease.`,
            isRisk: true,
            priority: 9,
        });
    } else if (features.sleep_hours_weekday > 9) {
        suggestions.push({
            feature: "sleep_hours_weekday",
            text: `You're getting ${features.sleep_hours_weekday} hrs of sleep — more than the recommended 7–9 hrs. Excessive sleep can be a sign of underlying health issues.`,
            isRisk: true,
            priority: 5,
        });
    } else {
        suggestions.push({
            feature: "sleep_hours_weekday",
            text: `Your sleep duration (${features.sleep_hours_weekday} hrs) is within the recommended 7–9 hrs range — this is actively protecting your health.`,
            isRisk: false,
            priority: 4,
        });
    }

    // Sedentary time
    const sedHrs = features.sedentary_minutes_per_day / 60;
    if (sedHrs >= 10) {
        suggestions.push({
            feature: "sedentary_minutes_per_day",
            text: `You're sedentary for ${sedHrs.toFixed(1)} hrs/day — high levels of sitting are linked to diabetes, hypertension, and cardiovascular risk. Try breaking up sitting with short walks every hour.`,
            isRisk: true,
            priority: 8,
        });
    } else if (sedHrs <= 6) {
        suggestions.push({
            feature: "sedentary_minutes_per_day",
            text: `Your sedentary time (${sedHrs.toFixed(1)} hrs/day) is within a healthy range — this is helping reduce your risk.`,
            isRisk: false,
            priority: 3,
        });
    }

    // Sugar
    if (features.day1_total_sugar_g > 50) {
        suggestions.push({
            feature: "day1_total_sugar_g",
            text: `Your sugar intake (${features.day1_total_sugar_g}g) exceeds the WHO recommendation of <50g/day. Try reducing sweetened drinks, processed foods, and added sugars.`,
            isRisk: true,
            priority: 7,
        });
    } else if (features.day1_total_sugar_g <= 25) {
        suggestions.push({
            feature: "day1_total_sugar_g",
            text: `Your sugar intake (${features.day1_total_sugar_g}g) is well within the WHO recommendation of <50g/day — keep it up.`,
            isRisk: false,
            priority: 3,
        });
    }

    // Caffeine
    if (features.day1_caffeine_mg > 400) {
        suggestions.push({
            feature: "day1_caffeine_mg",
            text: `Your caffeine intake (${features.day1_caffeine_mg}mg) exceeds the FDA safe limit of 400mg/day. Consider reducing coffee or energy drinks.`,
            isRisk: true,
            priority: 5,
        });
    }

    // Calories
    if (features.day1_calories > 3000) {
        suggestions.push({
            feature: "day1_calories",
            text: `Your calorie intake (${features.day1_calories} kcal) is high. Excess calories contribute to weight gain which increases risk across multiple conditions.`,
            isRisk: true,
            priority: 6,
        });
    }

    // Tobacco
    if (features.any_tobacco_use) {
        suggestions.push({
            feature: "any_tobacco_use",
            text: `Current tobacco use significantly raises your risk of cardiovascular disease, depression, and cancer. Cessation support can double your chances of quitting successfully.`,
            isRisk: true,
            priority: 10,
        });
    } else if (features.smoked_100_cigarettes_lifetime === "Yes") {
        suggestions.push({
            feature: "smoked_100_cigarettes_lifetime",
            text: `Your smoking history (100+ cigarettes lifetime) still contributes to elevated risk even after quitting. Continued smoke-free living is important.`,
            isRisk: true,
            priority: 6,
        });
    } else {
        suggestions.push({
            feature: "any_tobacco_use",
            text: `No current tobacco use — this is one of the strongest protective factors for cardiovascular and respiratory health.`,
            isRisk: false,
            priority: 5,
        });
    }

    if (features.current_smoker === "Every day") {
        suggestions.push({
            feature: "current_smoker",
            text: `Daily smoking is a major modifiable risk factor. Consider speaking to a doctor about nicotine replacement therapy or cessation programs.`,
            isRisk: true,
            priority: 10,
        });
    }

    // Binge drinking
    if (features.binge_drinking_past_year === "Yes") {
        suggestions.push({
            feature: "binge_drinking_past_year",
            text: `Binge drinking is associated with higher risk of liver disease, cardiovascular problems, and depression. Reducing alcohol consumption can have immediate health benefits.`,
            isRisk: true,
            priority: 7,
        });
    }

    // Healthcare access
    if (features.has_health_insurance === "No") {
        suggestions.push({
            feature: "has_health_insurance",
            text: `No health insurance is linked to delayed diagnosis and worse outcomes. Explore coverage options — many states offer low-cost or free plans.`,
            isRisk: true,
            priority: 6,
        });
    }

    if (features.routine_care_place === "There is no place") {
        suggestions.push({
            feature: "routine_care_place",
            text: `Not having a regular care place is associated with worse health outcomes. Establishing care with a primary care doctor enables preventive screening and early diagnosis.`,
            isRisk: true,
            priority: 6,
        });
    }

    // Food security
    if (features.adult_food_security === "Very low security" || features.adult_food_security === "Low security") {
        suggestions.push({
            feature: "adult_food_security",
            text: `Food insecurity is strongly linked to poor health outcomes, especially depression and diabetes. Community food programs, SNAP benefits, and food banks may be available in your area.`,
            isRisk: true,
            priority: 8,
        });
    }

    // General health
    if (features.general_health_self_report === "Poor") {
        suggestions.push({
            feature: "general_health_self_report",
            text: `You've rated your general health as Poor — this is a strong predictor of health risk. Consider scheduling a comprehensive health check-up.`,
            isRisk: true,
            priority: 9,
        });
    } else if (features.general_health_self_report === "Excellent" || features.general_health_self_report === "Very good") {
        suggestions.push({
            feature: "general_health_self_report",
            text: `You've rated your general health as ${features.general_health_self_report} — positive self-rated health is a strong protective factor. Maintain your current lifestyle.`,
            isRisk: false,
            priority: 5,
        });
    }

    return suggestions;
}

// ─────────────────────────────────────────────────────────────
// PHQ-9 BASED MENTAL HEALTH SUGGESTIONS
// Based on actual slider values, not SHAP
// ─────────────────────────────────────────────────────────────
function getMentalHealthSuggestions(features) {
    const suggestions = [];

    const phqTotal = (
        (features.phq_little_interest        || 0) +
        (features.phq_feeling_down           || 0) +
        (features.phq_sleep_problems         || 0) +
        (features.phq_tired                  || 0) +
        (features.phq_poor_appetite          || 0) +
        (features.phq_feeling_bad_about_self || 0) +
        (features.phq_trouble_concentrating  || 0) +
        (features.phq_moving_slowly          || 0) +
        (features.phq_thoughts_of_harm       || 0)
    );

    // Crisis — thoughts of harm always shown first
    if (features.phq_thoughts_of_harm >= 1) {
        suggestions.push({
            feature: "phq_thoughts_of_harm",
            text: `You've indicated thoughts of self-harm. Please reach out to a mental health professional or contact a crisis line (e.g., 988 Suicide & Crisis Lifeline) immediately. You are not alone.`,
            isRisk: true,
            priority: 20,
            isCrisis: true,
        });
    }

    // Overall PHQ-9 score
    if (phqTotal >= 15) {
        suggestions.push({
            feature: "phq_feeling_down",
            text: `Your responses suggest moderately severe to severe depression symptoms (estimated PHQ-9: ${phqTotal}/27). Please speak with a healthcare professional — effective treatments are available.`,
            isRisk: true,
            priority: 15,
        });
    } else if (phqTotal >= 10) {
        suggestions.push({
            feature: "phq_feeling_down",
            text: `Your responses suggest moderate depression symptoms (estimated PHQ-9: ${phqTotal}/27). Consider speaking with a doctor or mental health professional.`,
            isRisk: true,
            priority: 12,
        });
    } else if (phqTotal >= 5) {
        suggestions.push({
            feature: "phq_little_interest",
            text: `Your responses suggest mild depression symptoms (estimated PHQ-9: ${phqTotal}/27). Lifestyle changes like regular exercise, good sleep, and social connection can help.`,
            isRisk: true,
            priority: 8,
        });
    } else if (phqTotal === 0) {
        suggestions.push({
            feature: "phq_feeling_down",
            text: `No significant mental health symptoms reported — this is a strong protective factor for your overall health.`,
            isRisk: false,
            priority: 4,
        });
    }

    // Specific symptom suggestions
    if (features.phq_sleep_problems >= 2) {
        suggestions.push({
            feature: "phq_sleep_problems",
            text: `You've indicated significant sleep problems. Poor sleep quality is linked to higher risk across all 5 conditions. Consider speaking with a doctor about sleep hygiene or a sleep study.`,
            isRisk: true,
            priority: 9,
        });
    }

    if (features.phq_tired >= 2) {
        suggestions.push({
            feature: "phq_tired",
            text: `Persistent fatigue (nearly every day) is a significant health signal. It can indicate depression, thyroid issues, anaemia, or other conditions — worth discussing with a doctor.`,
            isRisk: true,
            priority: 8,
        });
    }

    if (features.phq_little_interest >= 2) {
        suggestions.push({
            feature: "phq_little_interest",
            text: `Loss of interest or pleasure in activities is a core symptom of depression. Consider reaching out to a mental health professional.`,
            isRisk: true,
            priority: 9,
        });
    }

    return suggestions;
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function Suggestions({ shapValues, features }) {
    if (!features) return null;

    // Get value-based suggestions
    const valueSuggestions  = getValueBasedSuggestions(features);
    const mentalSuggestions = getMentalHealthSuggestions(features);
    const allSuggestions    = [...valueSuggestions, ...mentalSuggestions]
        .sort((a, b) => b.priority - a.priority);

    // Crisis messages always shown
    const crisis    = allSuggestions.filter(s => s.isCrisis);
    const risks     = allSuggestions.filter(s => s.isRisk && !s.isCrisis).slice(0, 4);
    const positives = allSuggestions.filter(s => !s.isRisk).slice(0, 2);

    return (
        <div className="suggestions">

            {/* Crisis message */}
            {crisis.map((item) => (
                <div key={item.feature} className="suggestion-item suggestion-item--crisis">
                    <p className="suggestion-text">
                        <strong>⚠ {FEATURE_LABELS[item.feature] || item.feature}:</strong>{" "}{item.text}
                    </p>
                </div>
            ))}

            {/* Risk factors */}
            {risks.length > 0 && (
                <>
                    <p className="suggestions-section-label suggestions-section-label--risk">⚠ Factors raising your risk</p>
                    {risks.map((item, i) => (
                        <div key={item.feature} className="suggestion-item suggestion-item--risk" style={{ animationDelay: `${i * 0.07}s` }}>
                            <p className="suggestion-text">
                                <strong>{FEATURE_LABELS[item.feature] || item.feature}:</strong>{" "}{item.text}
                            </p>
                        </div>
                    ))}
                </>
            )}

            {/* Protective factors */}
            {positives.length > 0 && (
                <>
                    <p className="suggestions-section-label suggestions-section-label--positive">✓ What's protecting you</p>
                    {positives.map((item, i) => (
                        <div key={item.feature} className="suggestion-item suggestion-item--positive" style={{ animationDelay: `${(risks.length + i) * 0.07}s` }}>
                            <p className="suggestion-text">
                                <strong>{FEATURE_LABELS[item.feature] || item.feature}:</strong>{" "}{item.text}
                            </p>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}
