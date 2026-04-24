// ─────────────────────────────────────────────────────────────
// CLINICAL BENCHMARK SCORES
// Computed client-side from user inputs as reference points
// alongside ML model predictions
// ─────────────────────────────────────────────────────────────

// ── ADA Diabetes Risk Test ────────────────────────────────────
// Based on American Diabetes Association 7-question risk test
// https://www.diabetes.org/risk-test
// Score >= 5 = high risk, 3-4 = moderate, < 3 = low
export function adaDiabetesScore(features) {
    let score = 0;

    // Age
    if (features.age >= 60) score += 3;
    else if (features.age >= 50) score += 2;
    else if (features.age >= 40) score += 1;

    // BMI
    if (features.bmi >= 40) score += 3;
    else if (features.bmi >= 30) score += 2;
    else if (features.bmi >= 26) score += 1;

    // Waist (proxy for abdominal obesity)
    // Male >= 102cm, Female >= 88cm = high risk
    const waistThreshold = features.gender === "Female" ? 88 : 102;
    if (features.waist_cm >= waistThreshold) score += 2;
    else if (features.waist_cm >= waistThreshold - 10) score += 1;

    // Physical activity
    if (features.days_physically_active_past_30 === 0) score += 1;

    // Tobacco (proxy for unhealthy lifestyle)
    if (features.any_tobacco_use) score += 1;

    // General health (proxy for family history / existing conditions)
    if (features.general_health_self_report === "Poor") score += 2;
    else if (features.general_health_self_report === "Fair") score += 1;

    let level, description;
    if (score >= 5) {
        level = "High";
        description = "High risk — consider speaking with a healthcare provider";
    } else if (score >= 3) {
        level = "Moderate";
        description = "Moderate risk — lifestyle changes may help";
    } else {
        level = "Low";
        description = "Lower risk — maintain healthy habits";
    }

    return { score, maxScore: 12, level, description, source: "ADA Risk Test" };
}

// ── ASCVD 10-Year CVD Risk (Pooled Cohort Equations) ─────────
// Based on ACC/AHA 2013 Pooled Cohort Equations
// Goff et al., Circulation 2014
// Uses population medians for missing lab values
export function ascvdRisk(features) {
    const isMale = features.gender === "Male" || features.gender === 1;
    const age    = features.age;

    // Use population medians for lab values user didn't provide
    // NHANES population medians
    const totalChol = 195;  // mg/dL median
    const hdl       = isMale ? 47 : 57;  // mg/dL median by sex
    const sbp        = 120;  // systolic BP median mmHg
    const onBPMeds   = 0;
    const isDiabetic = 0;   // unknown for this user
    const isSmoker   = features.any_tobacco_use ? 1 : 0;

    let risk;

    if (isMale) {
        // White male equation
        const lnAge      = Math.log(age);
        const lnChol     = Math.log(totalChol);
        const lnHDL      = Math.log(hdl);
        const lnSBP      = Math.log(sbp);

        const sum = (12.344  * lnAge)
                  + (11.853  * lnChol)
                  - (2.664   * lnAge * lnChol)
                  - (7.990   * lnHDL)
                  + (1.769   * lnAge * lnHDL)
                  + (1.797   * lnSBP * (onBPMeds ? 1 : 0))
                  + (1.764   * lnSBP * (onBPMeds ? 0 : 1))
                  + (7.837   * isSmoker)
                  - (1.795   * lnAge * isSmoker)
                  + (0.658   * isDiabetic)
                  - 61.18;

        risk = 1 - Math.pow(0.9144, Math.exp(sum));
    } else {
        // White female equation
        const lnAge      = Math.log(age);
        const lnChol     = Math.log(totalChol);
        const lnHDL      = Math.log(hdl);
        const lnSBP      = Math.log(sbp);

        const sum = (-7.574  * lnAge)
                  + (0.661   * lnAge * lnAge)
                  + (0       * lnChol)  // simplified
                  - (7.990   * lnHDL)
                  + (1.769   * lnAge * lnHDL)
                  + (1.797   * lnSBP)
                  + (7.837   * isSmoker)
                  - (1.795   * lnAge * isSmoker)
                  - 172.3;

        risk = 1 - Math.pow(0.9665, Math.exp(sum));
    }

    // clamp to 0-1
    risk = Math.max(0, Math.min(1, risk));
    const pct = risk * 100;

    let level, description;
    if (pct >= 20) {
        level = "High";
        description = "High 10-yr risk — medical evaluation recommended";
    } else if (pct >= 7.5) {
        level = "Borderline-High";
        description = "Borderline high — discuss with a doctor";
    } else if (pct >= 5) {
        level = "Moderate";
        description = "Moderate risk — lifestyle changes recommended";
    } else {
        level = "Low";
        description = "Lower 10-yr risk";
    }

    return {
        pct:         parseFloat(pct.toFixed(1)),
        level,
        description,
        source:      "ACC/AHA ASCVD (est.)",
        caveat:      "Estimated using population median cholesterol and BP values"
    };
}

// ── PHQ-9 Depression Severity ────────────────────────────────
// Standard clinical interpretation of PHQ-9 total score
export function phq9Severity(features) {
    const score = (features.phq_poor_appetite          || 0)
                + (features.phq_feeling_bad_about_self || 0)
                + (features.phq_trouble_concentrating  || 0)
                + (features.phq_sleep_problems         || 0)
                + (features.phq_tired                  || 0)
                + (features.phq_moving_slowly          || 0);

    // Note: only 6 of 9 PHQ items are in sidebar
    // Scale to estimate full 9-item score
    const estimatedTotal = Math.round(score * (9/6));

    let level, description;
    if (estimatedTotal >= 20)      { level = "Severe";         description = "Severe depression symptoms"; }
    else if (estimatedTotal >= 15) { level = "Mod-Severe";     description = "Moderately severe depression symptoms"; }
    else if (estimatedTotal >= 10) { level = "Moderate";       description = "Moderate depression symptoms"; }
    else if (estimatedTotal >= 5)  { level = "Mild";           description = "Mild depression symptoms"; }
    else                           { level = "Minimal/None";   description = "Minimal depression symptoms"; }

    return {
        score:       estimatedTotal,
        maxScore:    27,
        level,
        description,
        source:      "PHQ-9 (estimated)",
        caveat:      "Based on 6 of 9 PHQ items — full score estimated"
    };
}
