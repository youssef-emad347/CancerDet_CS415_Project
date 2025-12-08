from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Any, Dict, List, Union, Optional
import numpy as np
import joblib
import tensorflow as tf
import time
import uuid
import os
from contextlib import asynccontextmanager

# ---------- CONFIG ----------
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
            "age", "pack_years", "gender_Male", "gender_Female",
            "radon_exposure_High", "radon_exposure_Low", "radon_exposure_Unknown",
            "asbestos_exposure_Yes", "asbestos_exposure_No",
            "secondhand_smoke_exposure_Yes", "secondhand_smoke_exposure_No",
            "copd_diagnosis_Yes", "copd_diagnosis_No",
            "alcohol_consumption_None", "alcohol_consumption_Moderate", "alcohol_consumption_High",
            "family_history_Yes", "family_history_No"
        ],
        "categorical_mapping": {
            "gender": ["Male", "Female"],
            "radon_exposure": ["High", "Low", "Unknown"],
            "asbestos_exposure": ["Yes", "No"],
            "secondhand_smoke_exposure": ["Yes", "No"],
            "copd_diagnosis": ["Yes", "No"],
            "alcohol_consumption": ["None", "Moderate", "High"],
            "family_history": ["Yes", "No"]
        }
    },
    "colorectal": {
        "model_path": os.path.join(ROOT, "Colorectal Cancer/colon_risk_model.keras"),
        "scaler_path": os.path.join(ROOT, "Colorectal Cancer/colon_scaler.pkl"),
        "features": [
            "Age", "Gender_Male", "Gender_Female", "BMI",
            "Lifestyle_Sedentary", "Lifestyle_Active", "Lifestyle_Very Active",
            "Ethnicity_African", "Ethnicity_Asian", "Ethnicity_Caucasian", "Ethnicity_Hispanic", "Ethnicity_Other",
            "Family_History_CRC_Yes", "Family_History_CRC_No",
            "Pre-existing Conditions_Diabetes", "Pre-existing Conditions_None", "Pre-existing Conditions_Other",
            "Carbohydrates (g)", "Proteins (g)", "Fats (g)",
            "Vitamin A (IU)", "Vitamin C (mg)", "Iron (mg)"
        ],
        "categorical_mapping": {
            "Gender": ["Male", "Female"],
            "Lifestyle": ["Sedentary", "Active", "Very Active"],
            "Ethnicity": ["African", "Asian", "Caucasian", "Hispanic", "Other"],
            "Family_History_CRC": ["Yes", "No"],
            "Pre-existing Conditions": ["Diabetes", "None", "Other"]
        }
    }
}

# In-memory holders
_loaded_models = {}
_loaded_scalers = {}


# ---------- Pydantic Models ----------
class PredictRequest(BaseModel):
    model_name: str = Field(..., description="Model name: 'breast', 'lung', or 'colorectal'")
    features: Dict[str, Any] = Field(..., description="Features dictionary")
    threshold: Optional[float] = Field(0.5, description="Classification threshold")


# ---------- Utility Functions ----------
def ensure_model_loaded(model_key: str):
    if model_key not in MODELS_INFO:
        raise HTTPException(status_code=400, detail=f"Unknown model '{model_key}'. Allowed: {list(MODELS_INFO.keys())}")

    if model_key not in _loaded_models:
        info = MODELS_INFO[model_key]
        try:
            _loaded_models[model_key] = tf.keras.models.load_model(info["model_path"])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load model file for '{model_key}': {e}")

    if model_key not in _loaded_scalers:
        info = MODELS_INFO[model_key]
        try:
            _loaded_scalers[model_key] = joblib.load(info["scaler_path"])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to load scaler for '{model_key}': {e}")


def preprocess_features(model_key: str, raw_features: Dict[str, Any]):
    info = MODELS_INFO[model_key]

    if model_key == "breast":
        # For breast cancer, use direct values
        features_list = []
        for feature_name in info["features"]:
            if feature_name not in raw_features:
                raise HTTPException(status_code=400, detail=f"Missing feature: {feature_name}")
            try:
                value = float(raw_features[feature_name])
                features_list.append(value)
            except ValueError:
                raise HTTPException(status_code=400,
                                    detail=f"Invalid value for {feature_name}: {raw_features[feature_name]}")

        return np.array(features_list).reshape(1, -1), raw_features

    elif model_key == "lung":
        # Preprocess lung cancer features (one-hot encoding)
        processed_features = []

        # Age and pack_years (continuous)
        try:
            processed_features.append(float(raw_features.get("age", 0)))
            processed_features.append(float(raw_features.get("pack_years", 0)))
        except ValueError:
            raise HTTPException(status_code=400, detail="Age and pack_years must be numbers")

        # Gender (one-hot)
        gender = raw_features.get("gender", "Male")
        gender_options = info["categorical_mapping"]["gender"]
        for option in gender_options:
            processed_features.append(1.0 if gender == option else 0.0)

        # Radon exposure (one-hot)
        radon = raw_features.get("radon_exposure", "Unknown")
        radon_options = info["categorical_mapping"]["radon_exposure"]
        for option in radon_options:
            processed_features.append(1.0 if radon == option else 0.0)

        # Boolean features (Yes/No)
        bool_features = [
            ("asbestos_exposure", "Yes"),
            ("secondhand_smoke_exposure", "Yes"),
            ("copd_diagnosis", "Yes"),
            ("family_history", "Yes")
        ]

        for feature_name, yes_value in bool_features:
            value = raw_features.get(feature_name, False)
            # Handle both boolean and string values
            if isinstance(value, bool):
                processed_features.append(1.0 if value else 0.0)
                processed_features.append(0.0 if value else 1.0)
            else:
                processed_features.append(1.0 if str(value) == yes_value else 0.0)
                processed_features.append(0.0 if str(value) == yes_value else 1.0)

        # Alcohol consumption (one-hot)
        alcohol = raw_features.get("alcohol_consumption", "None")
        alcohol_options = info["categorical_mapping"]["alcohol_consumption"]
        for option in alcohol_options:
            processed_features.append(1.0 if alcohol == option else 0.0)

        return np.array(processed_features).reshape(1, -1), raw_features

    elif model_key == "colorectal":
        # Preprocess colorectal cancer features
        processed_features = []

        # Age and BMI (continuous)
        try:
            processed_features.append(float(raw_features.get("Age", 0)))
            processed_features.append(float(raw_features.get("BMI", 0)))
        except ValueError:
            raise HTTPException(status_code=400, detail="Age and BMI must be numbers")

        # Gender (one-hot)
        gender = raw_features.get("Gender", "Male")
        gender_options = info["categorical_mapping"]["Gender"]
        for option in gender_options:
            processed_features.append(1.0 if gender == option else 0.0)

        # Lifestyle (one-hot)
        lifestyle = raw_features.get("Lifestyle", "Sedentary")
        lifestyle_options = info["categorical_mapping"]["Lifestyle"]
        for option in lifestyle_options:
            processed_features.append(1.0 if lifestyle == option else 0.0)

        # Ethnicity (one-hot)
        ethnicity = raw_features.get("Ethnicity", "Other")
        ethnicity_options = info["categorical_mapping"]["Ethnicity"]
        for option in ethnicity_options:
            processed_features.append(1.0 if ethnicity == option else 0.0)

        # Family History (one-hot)
        family_history = raw_features.get("Family_History_CRC", "No")
        family_history_options = info["categorical_mapping"]["Family_History_CRC"]
        for option in family_history_options:
            processed_features.append(1.0 if family_history == option else 0.0)

        # Pre-existing Conditions (one-hot)
        conditions = raw_features.get("Pre-existing Conditions", "None")
        conditions_options = info["categorical_mapping"]["Pre-existing Conditions"]
        for option in conditions_options:
            processed_features.append(1.0 if conditions == option else 0.0)

        # Nutritional values (continuous)
        nutritional_features = [
            "Carbohydrates (g)", "Proteins (g)", "Fats (g)",
            "Vitamin A (IU)", "Vitamin C (mg)", "Iron (mg)"
        ]

        for feature_name in nutritional_features:
            try:
                processed_features.append(float(raw_features.get(feature_name, 0)))
            except ValueError:
                raise HTTPException(status_code=400, detail=f"{feature_name} must be a number")

        return np.array(processed_features).reshape(1, -1), raw_features

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported model: {model_key}")


# ---------- Lifespan ----------
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[lifespan] Loading all models and scalers...")
    for key in MODELS_INFO.keys():
        try:
            ensure_model_loaded(key)
            print(f"[lifespan] Loaded: {key}")
        except Exception as e:
            print(f"[lifespan] Failed to load {key}: {e}")
    yield
    print("[lifespan] Server shutdown cleanup...")


# ---------- FastAPI App ----------
app = FastAPI(
    title="Cancer Prediction API",
    description="API for predicting cancer risk based on patient data",
    version="2.0",
    lifespan=lifespan
)


@app.get("/")
async def root():
    return {
        "message": "Cancer Prediction API",
        "version": "2.0",
        "available_models": list(MODELS_INFO.keys()),
        "endpoints": {
            "/health": "Check server and model status",
            "/predict": "Make predictions (POST)"
        }
    }


@app.get("/health")
def health():
    status = {}
    for k in MODELS_INFO:
        ok = (_loaded_models.get(k) is not None) and (_loaded_scalers.get(k) is not None)
        status[k] = "ready" if ok else "not_loaded"
    return {"status": "ok", "models": status}


@app.get("/models/{model_name}/features")
def get_model_features(model_name: str):
    if model_name not in MODELS_INFO:
        raise HTTPException(status_code=404, detail="Model not found")

    info = MODELS_INFO[model_name]
    return {
        "model": model_name,
        "features": info["features"],
        "categorical_mapping": info.get("categorical_mapping", {})
    }


@app.post("/predict")
async def predict(req: PredictRequest):
    req_id = str(uuid.uuid4())
    ts_start = time.time()

    model_key = req.model_name.lower()
    ensure_model_loaded(model_key)

    keras_model = _loaded_models[model_key]
    scaler = _loaded_scalers[model_key]

    # Preprocess features
    features_array, received_features = preprocess_features(model_key, req.features)

    # Scale features
    try:
        features_scaled = scaler.transform(features_array)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scaler.transform failed: {e}")

    # Predict
    try:
        prediction = keras_model.predict(features_scaled, verbose=0)
        prob = float(prediction.ravel()[0])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction failed: {e}")

    # Apply threshold
    threshold = req.threshold
    predicted_class = "positive" if prob >= threshold else "negative"
    risk_level = "high" if prob >= 0.7 else "medium" if prob >= 0.4 else "low"

    ts_end = time.time()
    processing_ms = int((ts_end - ts_start) * 1000)

    return {
        "request_id": req_id,
        "model": model_key,
        "prediction": {
            "class": predicted_class,
            "probability": prob,
            "risk_level": risk_level,
            "threshold_used": threshold
        },
        "processing_time_ms": processing_ms,
        "received_features": received_features
    }


@app.post("/predict/{model_name}")
async def predict_with_model_name(model_name: str, req: Dict[str, Any]):
    predict_req = PredictRequest(
        model_name=model_name,
        features=req.get("features", {}),
        threshold=req.get("threshold", 0.3)
    )
    return await predict(predict_req)