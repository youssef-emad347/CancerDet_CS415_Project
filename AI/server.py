from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, Optional
import numpy as np
import joblib
import tensorflow as tf
import time
import uuid
import os
from contextlib import asynccontextmanager

# ---------------------------------------------------------
# 🟦 CONFIG
# ---------------------------------------------------------
ROOT = os.path.dirname(__file__)

MODELS_INFO = {
    "breast": {
        "model_path": os.path.join(ROOT, "Breast Cancer/Breast_Cancer.keras"),
        "scaler_path": os.path.join(ROOT, "Breast Cancer/breast_cancer_scaler.pkl"),
        "features": [
            "radius_mean", "texture_mean", "perimeter_mean", "area_mean",
            "smoothness_mean", "compactness_mean", "concavity_mean",
            "concave_points_mean", "symmetry_mean", "fractal_dimension_mean",
            "radius_se", "texture_se", "perimeter_se", "area_se",
            "smoothness_se", "compactness_se", "concavity_se",
            "concave_points_se", "symmetry_se", "fractal_dimension_se",
            "radius_worst", "texture_worst", "perimeter_worst", "area_worst",
            "smoothness_worst", "compactness_worst", "concavity_worst",
            "concave_points_worst", "symmetry_worst", "fractal_dimension_worst"
        ]
    },

    "lung": {
        "model_path": os.path.join(ROOT, "Lung Cancer/Lung_Cancer.keras"),
        "scaler_path": os.path.join(ROOT, "Lung Cancer/lung_scaler.pkl"),

        "features": [
            "age", "pack_years", "cumulative_smoking",
            "gender_Male",
            "radon_exposure_High", "radon_exposure_Low",
            "asbestos_exposure_Yes",
            "secondhand_smoke_exposure_Yes",
            "copd_diagnosis_Yes",
            "alcohol_consumption_Moderate"
        ]
    },

    "colorectal": {
        "model_path": os.path.join(ROOT, "Colorectal Cancer/colon_risk_model.keras"),
        "scaler_path": os.path.join(ROOT, "Colorectal Cancer/colon_scaler.pkl"),

        # Final 13 features ONLY
        "features": [
            "Age", "Gender", "BMI", "Lifestyle", "Ethnicity",
            "Family_History_CRC", "Pre-existing Conditions",
            "Carbohydrates (g)", "Proteins (g)", "Fats (g)",
            "Vitamin A (IU)", "Vitamin C (mg)", "Iron (mg)"
        ]
    }
}

# In-memory loaded models
_loaded_models = {}
_loaded_scalers = {}

# ---------------------------------------------------------
# 🟦 Request Model
# ---------------------------------------------------------
class PredictRequest(BaseModel):
    model_name: str
    features: Dict[str, Any]
    threshold: Optional[float] = 0.5


# ---------------------------------------------------------
# 🟦 Loaders
# ---------------------------------------------------------
def ensure_model_loaded(model_key: str):
    if model_key not in MODELS_INFO:
        raise HTTPException(status_code=400, detail=f"Unknown model '{model_key}'")

    if model_key not in _loaded_models:
        _loaded_models[model_key] = tf.keras.models.load_model(
            MODELS_INFO[model_key]["model_path"]
        )

    if model_key not in _loaded_scalers:
        _loaded_scalers[model_key] = joblib.load(
            MODELS_INFO[model_key]["scaler_path"]
        )


# ---------------------------------------------------------
# 🟦 Preprocessing
# ---------------------------------------------------------
def preprocess_features(model_key: str, raw: Dict[str, Any]):
    info = MODELS_INFO[model_key]

    # -----------------------------
    # BREAST (30 numeric features)
    # -----------------------------
    if model_key == "breast":
        arr = []
        for f in info["features"]:
            if f not in raw:
                raise HTTPException(status_code=400, detail=f"Missing feature: {f}")
            arr.append(float(raw[f]))

        return np.array(arr).reshape(1, -1), raw

    # -----------------------------
    # LUNG (10 features)
    # -----------------------------
    if model_key == "lung":
        age = float(raw.get("age", 0))
        pack = float(raw.get("pack_years", 0))
        cumulative = age * pack

        arr = [
            age,
            pack,
            cumulative,
            1.0 if raw.get("gender") == "Male" else 0.0,
            1.0 if raw.get("radon_exposure") == "High" else 0.0,
            1.0 if raw.get("radon_exposure") == "Low" else 0.0,
            1.0 if raw.get("asbestos_exposure") == "Yes" else 0.0,
            1.0 if raw.get("secondhand_smoke_exposure") == "Yes" else 0.0,
            1.0 if raw.get("copd_diagnosis") == "Yes" else 0.0,
            1.0 if raw.get("alcohol_consumption") == "Moderate" else 0.0
        ]

        return np.array(arr).reshape(1, -1), raw

    # -----------------------------
    # COLORECTAL (13 FEATURES)
    # -----------------------------
    if model_key == "colorectal":

        mapping = {
            "Gender": {"Male": 1, "Female": 0},
            "Lifestyle": {"Sedentary": 0, "Moderate": 1, "Active": 2},
            "Ethnicity": {"African": 0, "Asian": 1, "Caucasian": 2, "Hispanic": 3, "Other": 4},
            "Family_History_CRC": {"Yes": 1, "No": 0},
            "Pre-existing Conditions": {"Diabetes": 0, "None": 1, "Other": 2}
        }

        arr = [
            float(raw.get("Age", 0)),
            mapping["Gender"].get(raw.get("Gender", ""), 0),
            float(raw.get("BMI", 0)),
            mapping["Lifestyle"].get(raw.get("Lifestyle", ""), 0),
            mapping["Ethnicity"].get(raw.get("Ethnicity", ""), 0),
            mapping["Family_History_CRC"].get(raw.get("Family_History_CRC", ""), 0),
            mapping["Pre-existing Conditions"].get(raw.get("Pre-existing Conditions", ""), 0),
            float(raw.get("Carbohydrates (g)", 0)),
            float(raw.get("Proteins (g)", 0)),
            float(raw.get("Fats (g)", 0)),
            float(raw.get("Vitamin A (IU)", 0)),
            float(raw.get("Vitamin C (mg)", 0)),
            float(raw.get("Iron (mg)", 0))
        ]

        return np.array(arr).reshape(1, -1), raw

    raise HTTPException(status_code=400, detail="Invalid model key")


# ---------------------------------------------------------
# 🟦 LIFESPAN
# ---------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    for key in MODELS_INFO:
        ensure_model_loaded(key)
    yield


# ---------------------------------------------------------
# 🟦 API
# ---------------------------------------------------------
app = FastAPI(title="Cancer Prediction API", version="3.0", lifespan=lifespan)

@app.post("/predict")
async def predict(req: PredictRequest):
    req_id = str(uuid.uuid4())

    model_key = req.model_name.lower()
    ensure_model_loaded(model_key)

    model = _loaded_models[model_key]
    scaler = _loaded_scalers[model_key]

    x, received = preprocess_features(model_key, req.features)
    x_scaled = scaler.transform(x)

    pred = float(model.predict(x_scaled, verbose=0).ravel()[0])

    result = "positive" if pred >= req.threshold else "negative"
    risk = "high" if pred >= 0.7 else "medium" if pred >= 0.4 else "low"

    return {
        "request_id": req_id,
        "model": model_key,
        "prediction": {
            "class": result,
            "probability": pred,
            "risk_level": risk,
            "threshold_used": req.threshold
        },
        "received_features": received
    }
