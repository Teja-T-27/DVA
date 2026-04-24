import os
import joblib
import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, classification_report
from xgboost import XGBClassifier

# ─────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────
DATA_PATH = "team108_nhanes_core.csv"
MODEL_DIR = "saved_models"

TARGETS = {
    "diabetes":     "diabetes_diagnosis",
    "hypertension": "hypertension_diagnosis",
    "depression":   "depression_phq9",       # derived
    "cvd":          "cardiovascular_risk",    # derived
    "fatty_liver":  "fatty_liver_diagnosis",  # derived
}

# ─────────────────────────────────────────────────────────────
# ALWAYS DROP
# ─────────────────────────────────────────────────────────────
ALWAYS_DROP = ["participant_id", "cycle", "survey_weight"]

# ─────────────────────────────────────────────────────────────
# LEAKAGE PER CONDITION
# ─────────────────────────────────────────────────────────────
LEAKAGE = {
    "diabetes": [
        "age_diabetes_diagnosed", "taking_insulin", "taking_diabetes_pills",
        "hba1c_pct", "fasting_glucose_mgdl", "glucose_serum_mgdl",
        "insulin_uuml", "prediabetes_diagnosis",
    ],
    "hypertension": [
        "hypertension_2plus_visits",
    ],
    "depression": [
        # drop all 9 PHQ questions — they ARE the label (sum >= 10)
        # including them gives AUC ~1.0 (pure leakage)
        # depression is predicted from lifestyle/demographic factors instead
        "phq_difficulty_at_work",
        "phq_little_interest", "phq_feeling_down", "phq_moving_slowly",
        "phq_poor_appetite", "phq_sleep_problems", "phq_tired",
        "phq_feeling_bad_about_self", "phq_trouble_concentrating",
        "phq_thoughts_of_harm",
    ],
    "cvd": [
        "coronary_heart_disease", "heart_attack", "stroke",
        "congestive_heart_failure", "angina",
    ],
    "fatty_liver": [
        # drop ALL 4 FLI formula ingredients to prevent leakage
        # model learns from other clinical markers instead
        "bmi", "waist_cm", "triglycerides_mgdl", "ggt_liver_enzyme_ul",
        # drop other direct liver markers
        "liver_condition", "still_have_liver_condition",
        "alt_liver_enzyme_ul", "ast_liver_enzyme_ul",
    ],
}

# ─────────────────────────────────────────────────────────────
# DERIVE LABELS
# ─────────────────────────────────────────────────────────────
def derive_labels(df):
    df = df.copy()

    # sex_male from gender string
    if "gender" in df.columns:
        df["sex_male"] = (df["gender"].str.strip().str.title() == "Male").astype(int)
        male_n   = (df["sex_male"] == 1).sum()
        female_n = (df["sex_male"] == 0).sum()
        print(f"  Sex: Male={male_n:,}  Female={female_n:,}")

    # PHQ-9 depression (clinical threshold >= 10)
    phq_cols = [
        "phq_little_interest", "phq_feeling_down", "phq_moving_slowly",
        "phq_poor_appetite", "phq_sleep_problems", "phq_tired",
        "phq_feeling_bad_about_self", "phq_trouble_concentrating",
        "phq_thoughts_of_harm",
    ]
    phq_data  = df[phq_cols]
    answered  = phq_data.notna().sum(axis=1)
    phq_score = phq_data.sum(axis=1)
    depression = pd.Series(np.nan, index=df.index, dtype=object)
    valid = answered >= 5
    depression.loc[valid & (phq_score >= 10)] = "Yes"
    depression.loc[valid & (phq_score <  10)] = "No"
    df["depression_phq9"] = depression
    print(f"  Depression: Yes={( depression=='Yes').sum():,}  No={(depression=='No').sum():,}  ({(depression=='Yes').sum()/depression.notna().sum():.1%} positive)")

    # Cardiovascular risk (combined)
    cvd_cols = ["coronary_heart_disease", "heart_attack", "stroke", "congestive_heart_failure"]
    cvd_yes  = df[cvd_cols].isin(["Yes"]).any(axis=1)
    cvd_no   = df[cvd_cols].notna().all(axis=1) & ~cvd_yes
    cvd_risk = pd.Series(np.nan, index=df.index, dtype=object)
    cvd_risk.loc[cvd_yes] = "Yes"
    cvd_risk.loc[cvd_no]  = "No"
    df["cardiovascular_risk"] = cvd_risk
    print(f"  CVD: Yes={(cvd_risk=='Yes').sum():,}  No={(cvd_risk=='No').sum():,}  ({(cvd_risk=='Yes').sum()/cvd_risk.notna().sum():.1%} positive)")

    # Fatty liver (FLI formula, Bedogni 2006)
    markers = ["bmi", "waist_cm", "triglycerides_mgdl", "ggt_liver_enzyme_ul"]
    mask = (
        df[markers].notna().all(axis=1)
        & (df["triglycerides_mgdl"] > 0)
        & (df["ggt_liver_enzyme_ul"] > 0)
    )
    liver_formula = (
        0.953 * np.log(df.loc[mask, "triglycerides_mgdl"])
        + 0.139 * df.loc[mask, "bmi"]
        + 0.718 * np.log(df.loc[mask, "ggt_liver_enzyme_ul"])
        + 0.053 * df.loc[mask, "waist_cm"]
        - 15.745
    )
    fli = np.exp(liver_formula) / (1 + np.exp(liver_formula)) * 100
    fatty_liver = pd.Series(np.nan, index=df.index, dtype=object)
    fatty_liver.loc[mask & (fli >= 60)] = "Yes"
    fatty_liver.loc[mask & (fli <  30)] = "No"
    df["fatty_liver_diagnosis"] = fatty_liver
    print(f"  Fatty Liver: Yes={(fatty_liver=='Yes').sum():,}  No={(fatty_liver=='No').sum():,}  ({(fatty_liver=='Yes').sum()/fatty_liver.notna().sum():.1%} positive)")

    return df

# ─────────────────────────────────────────────────────────────
# DATA PREPARATION
# ─────────────────────────────────────────────────────────────
def prepare_data(df, condition, target_col):
    df = df.dropna(subset=[target_col]).copy()

    # survey weights
    if "survey_weight" in df.columns:
        raw_w = df["survey_weight"].fillna(df["survey_weight"].median())
        survey_weights = raw_w / raw_w.mean()
    else:
        survey_weights = pd.Series(1.0, index=df.index)

    other_targets = [col for col in TARGETS.values() if col != target_col]
    leakage       = LEAKAGE.get(condition, [])
    drop          = ALWAYS_DROP + other_targets + leakage + ["gender"]
    drop          = [c for c in drop if c in df.columns]
    df = df.drop(columns=drop)

    # drop >60% missing
    df = df.dropna(thresh=int(0.4 * len(df)), axis=1)

    X = df.drop(columns=[target_col])
    y = df[target_col]

    training_medians = X.select_dtypes(include=[np.number]).median()

    num_cols = X.select_dtypes(include=[np.number]).columns
    X[num_cols] = X[num_cols].fillna(X[num_cols].median())

    cat_cols = X.select_dtypes(include=["object", "category"]).columns
    for col in cat_cols:
        X[col] = LabelEncoder().fit_transform(X[col].astype(str))

    le = LabelEncoder()
    y_encoded    = le.fit_transform(y.astype(str))
    feature_cols = X.columns.tolist()

    survey_weights = survey_weights.loc[X.index]

    X_train, X_test, y_train, y_test, w_train, w_test = train_test_split(
        X, y_encoded, survey_weights,
        test_size=0.2, random_state=42, stratify=y_encoded
    )

    scaler  = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test  = scaler.transform(X_test)

    return X_train, X_test, y_train, y_test, w_train, scaler, le, feature_cols, training_medians

# ─────────────────────────────────────────────────────────────
# TRAIN XGBOOST
# ─────────────────────────────────────────────────────────────
def train_xgboost(X_train, X_test, y_train, y_test, w_train, condition):
    neg = np.sum(y_train == 0)
    pos = np.sum(y_train == 1)
    spw = neg / pos if pos > 0 else 1
    print(f"  Class balance — Neg: {neg:,}  Pos: {pos:,}  scale_pos_weight: {spw:.1f}x")

    model = XGBClassifier(
        objective        = "binary:logistic",
        scale_pos_weight = spw,
        n_estimators     = 300,
        learning_rate    = 0.05,
        max_depth        = 5,
        min_child_weight = 5,
        subsample        = 0.8,
        colsample_bytree = 0.8,
        eval_metric      = "auc",
        random_state     = 42,
    )
    model.fit(X_train, y_train, sample_weight=w_train.values)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    f1  = f1_score(y_test, y_pred, average="weighted")
    try:
        auc = roc_auc_score(y_test, y_prob)
    except Exception:
        auc = float("nan")

    print(f"  Accuracy: {acc:.4f}  |  F1: {f1:.4f}  |  AUC-ROC: {auc:.4f}")
    print(f"  AUC target (>= 0.80): {'✓' if auc >= 0.80 else '✗ BELOW TARGET'}")
    print(classification_report(y_test, y_pred))

    return model, auc

# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 60)
    print(" Team 108 — Model Training (Final)")
    print("=" * 60)

    print("\nLoading NHANES data...")
    df = pd.read_csv(DATA_PATH)
    print(f"  Shape: {df.shape}")

    print("\nDeriving labels...")
    df = derive_labels(df)

    os.makedirs(MODEL_DIR, exist_ok=True)
    results = []

    print(f"\n{'='*60}\n Training\n{'='*60}")

    for condition, target_col in TARGETS.items():
        print(f"\n{'#'*60}\n  {condition.upper()}  (target: {target_col})\n{'#'*60}")

        if target_col not in df.columns:
            print(f"  Skipping — target not found.")
            continue

        X_train, X_test, y_train, y_test, w_train, scaler, le, feature_cols, training_medians = prepare_data(
            df, condition, target_col
        )
        print(f"  Features: {len(feature_cols)}  |  Train: {len(X_train):,}  Test: {len(X_test):,}")

        model, auc = train_xgboost(X_train, X_test, y_train, y_test, w_train, condition)

        joblib.dump(model,            f"{MODEL_DIR}/{condition}_xgboost.pkl")
        joblib.dump(scaler,           f"{MODEL_DIR}/{condition}_scaler.pkl")
        joblib.dump(le,               f"{MODEL_DIR}/{condition}_label_encoder.pkl")
        joblib.dump(feature_cols,     f"{MODEL_DIR}/{condition}_feature_order.pkl")
        joblib.dump(training_medians, f"{MODEL_DIR}/{condition}_medians.pkl")
        joblib.dump({"auc": auc},     f"{MODEL_DIR}/{condition}_metrics.pkl")
        print(f"  ✓ Saved {condition}_*.pkl")

        results.append({"condition": condition, "auc": auc, "features": len(feature_cols)})

    print(f"\n{'='*60}\n SUMMARY\n{'='*60}")
    for r in results:
        status = "✓" if r["auc"] >= 0.80 else "✗"
        print(f"  {status} {r['condition']:<20} AUC: {r['auc']:.4f}  Features: {r['features']}")
    print(f"\n  Models saved to '{MODEL_DIR}/'")
