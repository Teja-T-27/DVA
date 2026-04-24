import os
import joblib
import warnings
warnings.filterwarnings('ignore')

import shap
import pandas as pd
import numpy as np

from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

# ─────────────────────────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────────────────────────
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────
# PATHS
# ─────────────────────────────────────────────────────────────
BASE_DIR     = os.path.dirname(__file__)
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))
MODEL_DIR    = os.path.join(PROJECT_ROOT, "saved_models")

# ─────────────────────────────────────────────────────────────
# CONDITIONS
# ─────────────────────────────────────────────────────────────
CONDITIONS = ["diabetes", "hypertension", "depression", "cvd", "fatty_liver"]

# ─────────────────────────────────────────────────────────────
# LOAD MODELS
# ─────────────────────────────────────────────────────────────
MODELS         = {}
SCALERS        = {}
FEATURE_ORDERS = {}
EXPLAINERS     = {}
MEDIANS        = {}

for c in CONDITIONS:
    MODELS[c]         = joblib.load(os.path.join(MODEL_DIR, f"{c}_xgboost.pkl"))
    SCALERS[c]        = joblib.load(os.path.join(MODEL_DIR, f"{c}_scaler.pkl"))
    FEATURE_ORDERS[c] = joblib.load(os.path.join(MODEL_DIR, f"{c}_feature_order.pkl"))
    MEDIANS[c]        = joblib.load(os.path.join(MODEL_DIR, f"{c}_medians.pkl"))
    EXPLAINERS[c]     = shap.Explainer(MODELS[c])

print("✓ All models loaded")

# ─────────────────────────────────────────────────────────────
# INPUT SCHEMA
# These are the fields the frontend sidebar sends.
# Everything else the model needs gets filled from training medians.
# ─────────────────────────────────────────────────────────────
class Features(BaseModel):
    age:                        float = 45
    gender:                     str   = "Male"
    bmi:                        float = 26.0
    weight_kg:                  float = 70.0
    height_cm:                  float = 170.0
    waist_cm:                   float = 88.0
    sleep_hours_weekday:        float = 7.0
    short_sleep:                int   = 0
    long_sleep:                 int   = 0
    sedentary_minutes_per_day:  float = 360.0
    day1_calories:              float = 2000.0
    day1_protein_g:             float = 80.0
    day1_total_sugar_g:         float = 50.0
    day1_caffeine_mg:           float = 100.0
    any_tobacco_use:              float = 0.0
    avg_drinks_per_day:           float = 0.0
    phq_poor_appetite:            float = 0.0
    phq_feeling_bad_about_self:   float = 0.0
    phq_trouble_concentrating:    float = 0.0
    general_health_self_report:     str   = "Good"
    days_physically_active_past_30: float = 3.0
    smoked_100_cigarettes_lifetime: str   = "No"
    current_smoker:                 str   = "Not at all"
    binge_drinking_past_year:       str   = "No"
    has_health_insurance:           str   = "Yes"
    routine_care_place:             str   = "Yes"
    tried_to_lose_weight_past_year: str   = "No"
    adult_food_security:            str   = "Full security"
    phq_little_interest:            float = 0.0
    phq_feeling_down:               float = 0.0
    phq_sleep_problems:             float = 0.0
    phq_tired:                      float = 0.0
    phq_moving_slowly:              float = 0.0
    phq_thoughts_of_harm:           float = 0.0

# ─────────────────────────────────────────────────────────────
# PREDICT ENDPOINT
# ─────────────────────────────────────────────────────────────
@app.post("/predict")
def predict(features: Features):

    features_dict = features.dict()

    # derive sex_male from gender string — matches training encoding
    features_dict["sex_male"] = 1 if features_dict.get("gender", "Male") == "Male" else 0
    features_dict.pop("gender", None)  # model uses sex_male not gender string

    # encode general_health_self_report string → integer
    health_map = {"Excellent": 0, "Fair": 1, "Good": 2, "Poor": 3, "Very good": 4}
    features_dict["general_health_self_report"] = health_map.get(features_dict["general_health_self_report"], 2)

    # encode all other string fields using simple label encoding
    # order matches what LabelEncoder produces alphabetically
    yes_no_map        = {"No": 0, "Yes": 1}
    food_security_map = {"Full security": 0, "Low security": 1, "Marginal security": 2, "Very low security": 3}
    smoker_map        = {"Every day": 0, "Not at all": 1, "Some days": 2}
    care_place_map    = {"More than one place": 0, "There is no place": 1, "Yes": 2}

    features_dict["smoked_100_cigarettes_lifetime"] = yes_no_map.get(features_dict["smoked_100_cigarettes_lifetime"], 0)
    features_dict["current_smoker"]                 = smoker_map.get(features_dict["current_smoker"], 1)
    features_dict["binge_drinking_past_year"]        = yes_no_map.get(features_dict["binge_drinking_past_year"], 0)
    features_dict["has_health_insurance"]            = yes_no_map.get(features_dict["has_health_insurance"], 1)
    features_dict["routine_care_place"]              = care_place_map.get(features_dict["routine_care_place"], 2)
    features_dict["tried_to_lose_weight_past_year"]  = yes_no_map.get(features_dict["tried_to_lose_weight_past_year"], 0)
    features_dict["adult_food_security"]             = food_security_map.get(features_dict["adult_food_security"], 0)

    risks       = {}
    shap_output = {}

    for c in CONDITIONS:
        model         = MODELS[c]
        scaler        = SCALERS[c]
        feature_order = FEATURE_ORDERS[c]
        explainer     = EXPLAINERS[c]
        medians       = MEDIANS[c]

        # build a row with all features the model expects
        # start from training medians so lab values get real population averages
        # then overwrite with whatever the user actually provided
        row = {}
        for feat in feature_order:
            if feat in features_dict:
                # user provided this value — use it
                row[feat] = features_dict[feat]
            elif feat in medians:
                # user didn't provide — fill with training median
                row[feat] = float(medians[feat])
            else:
                # unknown feature — fill with 0 as fallback
                row[feat] = 0.0

        x = pd.DataFrame([row])[feature_order].astype(float)

        # scale
        x_scaled = scaler.transform(x)

        # predict
        prob = model.predict_proba(x_scaled)
        prob = float(prob[0][1]) if prob.shape[1] > 1 else float(prob[0][0])

        # SHAP
        shap_values = explainer(x_scaled, check_additivity=False)
        values      = shap_values.values

        if values.ndim == 3:
            values = values[0, :, 1]
        elif values.ndim == 2:
            values = values[0]
        else:
            values = values.flatten()

        shap_dict = {
            feature_order[i]: float(values[i])
            for i in range(len(feature_order))
        }

        risks[c]       = prob
        shap_output[c] = shap_dict

    return {
        "risks": risks,
        "shap":  shap_output,
    }


# ─────────────────────────────────────────────────────────────
# METRICS ENDPOINT
# returns AUC scores and top features per condition
# ─────────────────────────────────────────────────────────────
@app.get("/metrics")
def get_metrics():
    output = {}
    for c in CONDITIONS:
        feature_order  = FEATURE_ORDERS[c]
        model          = MODELS[c]
        importances    = model.feature_importances_

        # load saved AUC if available
        import os
        metrics_path = os.path.join(MODEL_DIR, f"{c}_metrics.pkl")
        auc = joblib.load(metrics_path)["auc"] if os.path.exists(metrics_path) else None

        # top 10 features by importance
        top_idx = sorted(range(len(importances)), key=lambda i: importances[i], reverse=True)[:10]
        top_features = [
            {"feature": feature_order[i], "importance": float(importances[i])}
            for i in top_idx
        ]

        output[c] = {
            "auc":          round(auc, 4) if auc else None,
            "top_features": top_features,
            "n_features":   len(feature_order),
        }

    return output


# ─────────────────────────────────────────────────────────────
# TOP FEATURES ENDPOINT
# returns top N most impactful user-controllable features per condition
# ─────────────────────────────────────────────────────────────
USER_FEATURES = [
    "age", "gender", "bmi", "weight_kg", "height_cm", "waist_cm",
    "sleep_hours_weekday", "sedentary_minutes_per_day",
    "days_physically_active_past_30", "general_health_self_report",
    "any_tobacco_use", "avg_drinks_per_day",
    "day1_calories", "day1_protein_g", "day1_total_fat_g", "day1_carbs_g",
    "day1_total_sugar_g", "day1_fiber_g", "day1_caffeine_mg",
    "phq_poor_appetite", "phq_feeling_bad_about_self", "phq_trouble_concentrating",
]

@app.get("/top_features/{condition}")
def get_top_features(condition: str, n: int = 10):
    if condition not in CONDITIONS:
        return {"error": f"Unknown condition: {condition}"}

    feature_order = FEATURE_ORDERS[condition]
    importances   = MODELS[condition].feature_importances_

    # filter to only user-controllable features
    user_scores = [
        {"feature": feature_order[i], "importance": float(importances[i])}
        for i in range(len(feature_order))
        if feature_order[i] in USER_FEATURES
    ]
    user_scores.sort(key=lambda x: x["importance"], reverse=True)

    return {"condition": condition, "top_features": user_scores[:n]}
