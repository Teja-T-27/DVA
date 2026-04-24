// ─────────────────────────────────────────────────────────────
// CONDITIONS
// must match the keys used in app.py CONDITIONS list
// ─────────────────────────────────────────────────────────────
export const CONDITIONS = [
  { key: "diabetes",     label: "Diabetes",       icon: "🩸" },
  { key: "hypertension", label: "Hypertension",   icon: "💓" },
  { key: "depression",   label: "Depression",     icon: "🧠" },
  { key: "cvd",          label: "Cardiovascular", icon: "❤️" },
  { key: "high_cholesterol", label: "Cholesterol", icon: "🧪" },
];

// ─────────────────────────────────────────────────────────────
// FEATURE LABELS
// human-readable names for every feature that might appear in SHAP
// ─────────────────────────────────────────────────────────────
export const FEATURE_LABELS = {
    age:                            "Age",
    gender:                         "Gender",
    bmi:                            "BMI",
    weight_kg:                      "Weight",
    height_cm:                      "Height",
    waist_cm:                       "Waist Circumference",
    sleep_hours_weekday:            "Sleep Duration",
    short_sleep:                    "Short Sleep (<6h)",
    long_sleep:                     "Long Sleep (>9h)",
    sedentary_minutes_per_day:      "Sedentary Time",
    days_physically_active_past_30: "Active Days per Week",
    general_health_self_report:     "General Health",
    any_tobacco_use:                "Tobacco Use",
    avg_drinks_per_day:             "Alcohol Intake",
    day1_calories:                  "Calories",
    day1_protein_g:                 "Protein",
    day1_total_fat_g:               "Total Fat",
    day1_carbs_g:                   "Carbohydrates",
    day1_total_sugar_g:             "Sugar",
    day1_fiber_g:                   "Fiber",
    day1_caffeine_mg:               "Caffeine",
    day1_alcohol_g:                 "Dietary Alcohol",
    day1_sodium_mg:                 "Sodium",
    day1_cholesterol_mg:            "Dietary Cholesterol",
    day1_saturated_fat_g:           "Saturated Fat",
    day1_potassium_mg:              "Potassium",
    day1_calcium_mg:                "Calcium",
    day1_iron_mg:                   "Iron",
    day1_vitamin_c_mg:              "Vitamin C",
    day1_vitamin_d_mcg:             "Vitamin D",
    phq_poor_appetite:              "Poor Appetite",
    phq_feeling_bad_about_self:     "Feeling Bad About Self",
    phq_trouble_concentrating:      "Trouble Concentrating",
    phq_little_interest:            "Little Interest",
    phq_feeling_down:               "Feeling Down",
    phq_sleep_problems:             "Sleep Problems",
    phq_tired:                      "Fatigue",
    phq_moving_slowly:              "Moving Slowly",
    phq_thoughts_of_harm:           "Thoughts of Harm",
    total_cholesterol_mgdl:         "Total Cholesterol",
    hdl_cholesterol_mgdl:           "HDL Cholesterol",
    ldl_cholesterol_mgdl:           "LDL Cholesterol",
    triglycerides_mgdl:             "Triglycerides",
    hba1c_pct:                      "HbA1c",
    fasting_glucose_mgdl:           "Fasting Glucose",
    crp_inflammation_mgl:           "CRP (Inflammation)",
    alt_liver_enzyme_ul:            "ALT (Liver)",
    ast_liver_enzyme_ul:            "AST (Liver)",
    ggt_liver_enzyme_ul:            "GGT (Liver)",
    albumin_creatinine_ratio:       "Albumin/Creatinine Ratio",
    uric_acid_mgdl:                 "Uric Acid",
    hemoglobin_gdl:                 "Hemoglobin",
    white_blood_cells:              "White Blood Cells",
    platelets:                      "Platelets",
    medication_count:               "Medication Count",
    general_health_self_report:     "General Health",
    income_poverty_ratio:           "Income/Poverty Ratio",
    race_ethnicity:                 "Race/Ethnicity",
    education:                      "Education",
    age:                            "Age",
    occupation_category:            "Occupation",
    adult_food_security:            "Food Security",
    snap_benefits:                  "SNAP Benefits",
    routine_care_place:             "Routine Care Access",
    has_health_insurance:           "Health Insurance",
    healthcare_visits_past_year:    "Healthcare Visits",
    high_cholesterol_diagnosis:     "High Cholesterol",
    prediabetes_diagnosis:          "Prediabetes",
    self_reported_weight_1yr_ago:   "Weight 1yr Ago",
    tried_to_lose_weight_past_year: "Tried to Lose Weight",
};

// ─────────────────────────────────────────────────────────────
// SELECTED FEATURES
// features the user can control via the sidebar
// these are the only ones shown in SHAP chart + suggestions
// ─────────────────────────────────────────────────────────────
export const SELECTED_FEATURES = [
    "age",
    "gender",
    "bmi",
    "weight_kg",
    "height_cm",
    "waist_cm",
    "sleep_hours_weekday",
    "sedentary_minutes_per_day",
    "days_physically_active_past_30",
    "general_health_self_report",
    "any_tobacco_use",
    "avg_drinks_per_day",
    "day1_calories",
    "day1_protein_g",
    "day1_total_fat_g",
    "day1_carbs_g",
    "day1_total_sugar_g",
    "day1_fiber_g",
    "day1_caffeine_mg",
    "phq_poor_appetite",
    "phq_feeling_bad_about_self",
    "phq_trouble_concentrating",
];

// ─────────────────────────────────────────────────────────────
// DEFAULT FEATURES
// initial values shown in sidebar on load
// ─────────────────────────────────────────────────────────────
export const DEFAULT_FEATURES = {
    age:                            45,
    gender:                         "Male",
    bmi:                            26.0,
    weight_kg:                      70,
    height_cm:                      170,
    waist_cm:                       88,
    sleep_hours_weekday:            7.0,
    short_sleep:                    0,
    long_sleep:                     0,
    sedentary_minutes_per_day:      360,
    days_physically_active_past_30: 3,
    general_health_self_report:     "Good",
    day1_calories:                  2000,
    day1_protein_g:                 80,
    day1_total_fat_g:               70,
    day1_carbs_g:                   250,
    day1_total_sugar_g:             60,
    day1_fiber_g:                   20,
    day1_caffeine_mg:               100,
    any_tobacco_use:                0,
    avg_drinks_per_day:             0,
    phq_poor_appetite:              0,
    phq_feeling_bad_about_self:     0,
    phq_trouble_concentrating:      0,
};

// ─────────────────────────────────────────────────────────────
// RISK LEVELS
// ─────────────────────────────────────────────────────────────
export function getRiskLevel(score) {
    if (score < 25) return "low";
    if (score < 55) return "moderate";
    return "high";
}

export function getRiskLabel(score) {
    if (score < 25) return "Low";
    if (score < 55) return "Moderate";
    return "High";
}

// ─────────────────────────────────────────────────────────────
// BACKEND URL
// reads from .env in production, falls back to localhost
// ─────────────────────────────────────────────────────────────
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";
