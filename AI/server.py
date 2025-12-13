from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Any, Dict, Optional
import numpy as np
import joblib
import tensorflow as tf
import uuid
import os
import json
from contextlib import asynccontextmanager

# ---------------------------------------------------------
# 🟦 CONFIG & PATHS
# ---------------------------------------------------------
ROOT = os.path.dirname(__file__)

# Define paths to your NEW mapping files
MAPPING_PATHS = {
    "colorectal": os.path.join(ROOT, "Colorectal Cancer/colon_mappings.json"),
    "lung": os.path.join(ROOT, "Lung Cancer/lung_mappings.json"),
}

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
        "features": [] 
    },
    "colorectal": {
        "model_path": os.path.join(ROOT, "Colorectal Cancer/colon_risk_model.keras"),
        "scaler_path": os.path.join(ROOT, "Colorectal Cancer/colon_scaler.pkl"),
        "features": [] 
    }
}

# ---------------------------------------------------------
# 🟦 GLOBAL STORAGE
# ---------------------------------------------------------
_loaded_models = {}
_loaded_scalers = {}
_loaded_mappings = {}

# ---------------------------------------------------------
# 🟦 HELPERS
# ---------------------------------------------------------
def load_resources():
    print("⏳ Loading resources...")
    
    # 1. Load Models & Scalers
    for key, info in MODELS_INFO.items():
        if os.path.exists(info["model_path"]):
            _loaded_models[key] = tf.keras.models.load_model(info["model_path"])
            _loaded_scalers[key] = joblib.load(info["scaler_path"])
            print(f"   ✅ Loaded {key} model")
        else:
            print(f"   ❌ Missing file for {key}")

    # 2. Load JSON Mappings
    for key, path in MAPPING_PATHS.items():
        if os.path.exists(path):
            with open(path, "r") as f:
                _loaded_mappings[key] = json.load(f)
            print(f"   ✅ Loaded mappings for {key}")
        else:
            print(f"   ⚠️ No mapping file found for {key}")
            _loaded_mappings[key] = {}

def get_mapped_value(cancer_type, feature_name, raw_value, default_val=0):
    """
    Looks up the value in the loaded JSON maps.
    Example: get_mapped_value("lung", "gender", "Male") -> 1
    """
    if cancer_type in _loaded_mappings:
        if feature_name in _loaded_mappings[cancer_type]:
            # Convert raw_value to string because JSON keys are always strings
            return _loaded_mappings[cancer_type][feature_name].get(str(raw_value), default_val)
    return default_val

# ---------------------------------------------------------
# 🟦 PREPROCESSING LOGIC
# ---------------------------------------------------------
def preprocess_features(model_key: str, raw: Dict[str, Any]):
    
    # --- BREAST (Numeric Only) ---
    if model_key == "breast":
        info = MODELS_INFO["breast"]
        arr = []
        for f in info["features"]:
            val = raw.get(f)
            if val is None:
                raise HTTPException(status_code=400, detail=f"Missing feature: {f}")
            arr.append(float(val))
        return np.array(arr).reshape(1, -1), raw

    # --- LUNG (Hybrid Mapping) ---
    if model_key == "lung":
        # 1. Numeric Calculation
        age = float(raw.get("age", 0))
        pack = float(raw.get("pack_years", 0))
        cumulative = age * pack
        
        # 2. Map Categoricals using the JSON file
        # We use the keys exactly as they appear in 'lung_mappings.json'
        
        # Note: 'default_val' handles cases where input is missing or misspelled
        gender = get_mapped_value("lung", "gender", raw.get("gender"), 0)
        
        # Ordinal mappings (Low/Med/High) are inside the JSON now too!
        radon = get_mapped_value("lung", "radon_exposure", raw.get("radon_exposure"), 0)
        alcohol = get_mapped_value("lung", "alcohol_consumption", raw.get("alcohol_consumption"), 0)
        
        # Yes/No mappings (LabelEncoded in training, so alphabetical: No=0, Yes=1)
        asbestos = get_mapped_value("lung", "asbestos_exposure", raw.get("asbestos_exposure"), 0)
        secondhand = get_mapped_value("lung", "secondhand_smoke_exposure", raw.get("secondhand_smoke_exposure"), 0)
        copd = get_mapped_value("lung", "copd_diagnosis", raw.get("copd_diagnosis"), 0)
        family = get_mapped_value("lung", "family_history", raw.get("family_history"), 1)

        # 3. Assemble Array (Order MUST match training DataFrame columns)
        arr = [age, pack, gender, radon, asbestos, secondhand, copd, alcohol, family, cumulative]
        
        return np.array(arr).reshape(1, -1), raw

    # --- COLORECTAL (LabelEncoder Mapping) ---
    if model_key == "colorectal":
        
        age = float(raw.get("Age", 0))
        bmi = float(raw.get("BMI", 0))
        
        # Use JSON maps
        gender = get_mapped_value("colorectal", "Gender", raw.get("Gender"), 0)
        lifestyle = get_mapped_value("colorectal", "Lifestyle", raw.get("Lifestyle"), 2) 
        ethnicity = get_mapped_value("colorectal", "Ethnicity", raw.get("Ethnicity"), 4) 
        # HISTORY INVERSION:
        # Model treats 0 as Riskier (Raw 0.41) and 1 as Safer (Raw 0.45).
        # We want "Yes" to be Riskier. So "Yes" must map to 0. "No" map to 1.
        hist_input = str(raw.get("Family_History_CRC", "No"))
        history = 0 if hist_input == "Yes" else 1 
        conditions = get_mapped_value("colorectal", "Pre-existing Conditions", raw.get("Pre-existing Conditions"), 1) 

        # Nutrition
        carbs = float(raw.get("Carbohydrates (g)", 0))
        prot = float(raw.get("Proteins (g)", 0))
        fats = float(raw.get("Fats (g)", 0))
        vit_a = float(raw.get("Vitamin A (IU)", 0))
        vit_c = float(raw.get("Vitamin C (mg)", 0))
        iron = float(raw.get("Iron (mg)", 0))

        arr = [
            age, gender, bmi, lifestyle, ethnicity, 
            history, conditions, 
            carbs, prot, fats, vit_a, vit_c, iron
        ]
        
        return np.array(arr).reshape(1, -1), raw

    raise HTTPException(status_code=400, detail="Invalid model key")

# ---------------------------------------------------------
# 🟦 LIFESPAN & APP INIT
# ---------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Reload resources on startup
    load_resources()
    yield

class PredictRequest(BaseModel):
    model_name: str
    features: Dict[str, Any]
    threshold: Optional[float] = 0.5

from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

app = FastAPI(title="Cancer Prediction API", version="3.1", lifespan=lifespan)

# 1. ENABLE CORS (Critical for App/Web access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# 2. LOGGING MIDDLEWARE (To see if requests reach the server)
class LogRequestMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        print(f"👉 INCOMING: {request.method} {request.url}")
        try:
            response = await call_next(request)
            print(f"   ✅ STATUS: {response.status_code}")
            return response
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
            raise e

app.add_middleware(LogRequestMiddleware)



# ---------------------------------------------------------
# 🟦 PREDICTION ENDPOINT
# ---------------------------------------------------------
@app.post("/predict")
async def predict(req: PredictRequest):
    req_id = str(uuid.uuid4())
    model_key = req.model_name.lower()

    if model_key not in _loaded_models:
        raise HTTPException(status_code=500, detail=f"Model {model_key} not loaded properly")

    model = _loaded_models[model_key]
    scaler = _loaded_scalers[model_key]

    x, received = preprocess_features(model_key, req.features)
    x_scaled = scaler.transform(x)
    pred = float(model.predict(x_scaled, verbose=0).ravel()[0])

    # Colorectal Inversion Logic
    if model_key == "colorectal":
        pred = 1.0 - pred
        
    # Result Logic
    risk = "high" if pred >= 0.7 else "medium" if pred >= 0.4 else "low"
    result = "positive" if risk == "high" else "negative"

    return {
        "request_id": req_id,
        "model": model_key,
        "prediction": {
            "class": result,
            "probability": pred,
            "risk_level": risk
        }
    }

# ---------------------------------------------------------
# 🟦 PDF EXTRACTION ENDPOINT
# ---------------------------------------------------------
# ---------------------------------------------------------
# 🟦 PDF EXTRACTION ENDPOINT
# ---------------------------------------------------------
from fastapi import UploadFile, File, Form
from fastapi.concurrency import run_in_threadpool
from pypdf import PdfReader
from thefuzz import fuzz
import io
import re

# NOTE: This must be SYNC to run in threadpool efficiently
def extract_text_from_pdf_sync(file_bytes):
    try:
        print("   Starting PDF text extraction...")
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for i, page in enumerate(reader.pages):
            text += page.extract_text() + "\n"
        print(f"   Extracted {len(text)} chars from {len(reader.pages)} pages.")
        return text
    except Exception as e:
        print(f"   ❌ PDF Read Error: {e}")
        return ""

def fuzzy_extract(text, keys, is_numeric=True):
    """
    Finds a line containing one of the 'keys' with high fuzzy ratio,
    then regex-extracts the number value from that line.
    """
    lines = text.split('\n')
    best_score = 0
    best_val = None

    for line in lines:
        for key in keys:
            token_ratio = fuzz.partial_ratio(key.lower(), line.lower())
            
            if token_ratio > 85: # High confidence match
                matches = re.findall(r"[-+]?\d*\.\d+|\d+", line)
                if matches:
                    val = float(matches[-1]) 
                    if token_ratio > best_score:
                        best_score = token_ratio
                        best_val = val
    
    return best_val

def process_pdf_logic(type: str, file_bytes: bytes):
    text = extract_text_from_pdf_sync(file_bytes)
    
    # 1. Validation (Is it medical?)
    valid_keywords = ["report", "lab", "analysis", "patient", "medical", "blood", "scan", "diagnosis"]
    valid_score = 0
    for kw in valid_keywords:
        if kw in text.lower():
            valid_score += 1
            
    if valid_score < 2:
        print("   ⚠️ Low confidence that this is a medical report")

    extracted_data = {}

    # 2. Extraction Logic based on Type
    print(f"   Extracting features for {type}...")
    if type == "lung":
        # Lung Keys: Age, Pack Years, Radon...
        extracted_data["age"] = fuzzy_extract(text, ["Age", "Patient Age", "DOB", "Years old"])
        extracted_data["packYears"] = fuzzy_extract(text, ["Pack Years", "Smoking History", "Packs per day"])
        
    elif type == "colorectal":
        extracted_data["age"] = fuzzy_extract(text, ["Age", "Years old"])
        extracted_data["bmi"] = fuzzy_extract(text, ["BMI", "Body Mass Index"])
        extracted_data["carbs"] = fuzzy_extract(text, ["Carbohydrates", "Carbs"])
        extracted_data["proteins"] = fuzzy_extract(text, ["Proteins", "Protein"])
        extracted_data["fats"] = fuzzy_extract(text, ["Fats", "Fat"])
        extracted_data["vitA"] = fuzzy_extract(text, ["Vitamin A", "Vit A"])
        
    elif type == "breast":
        features = MODELS_INFO["breast"]["features"]
        for f in features:
            human_name = f.replace("_", " ")
            val = fuzzy_extract(text, [human_name])
            if val is not None:
                extracted_data[f] = val

    print(f"   ✅ Extraction Complete: {extracted_data}")
    return {"status": "success", "data": extracted_data, "text_preview": text[:200]}

@app.post("/extract-pdf")
async def extract_pdf(type: str = Form(...), file: UploadFile = File(...)):
    print(f"📄 Processing PDF Upload for {type}...")
    
    # Read content asynchronously (IO bound)
    content = await file.read()
    
    # Run CPU-bound extraction in a separate thread to avoid blocking server
    result = await run_in_threadpool(process_pdf_logic, type, content)
    
    return result


