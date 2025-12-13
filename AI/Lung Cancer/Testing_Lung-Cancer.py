import pandas as pd
import numpy as np
import joblib
from tensorflow.keras.models import load_model

# ====================================================
# 1. SETUP
# ====================================================
MODEL_FILE = 'Lung_Cancer.keras'
SCALER_FILE = 'lung_scaler.pkl'
THRESHOLD = 0.3  # The threshold we tuned for Lung Cancer

# ====================================================
# 2. LOAD
# ====================================================
print(f"⏳ Loading {MODEL_FILE}...")
model = load_model(MODEL_FILE)
scaler = joblib.load(SCALER_FILE)
print("✅ Model & Scaler loaded!")

# ====================================================
# 3. DEFINE PATIENT DATA
# ====================================================

# CASE A: 🔴 BAD / HIGH RISK
# Older, heavy smoker, works in construction (asbestos), has COPD
patient_bad = {
    'age': [72],
    'pack_years': [50.5],             # High smoking history
    'gender': [1],                    # 1 = Male
    'radon_exposure': [1],            # 1 = Yes
    'asbestos_exposure': [1],         # 1 = Yes
    'secondhand_smoke_exposure': [1], # 1 = Yes
    'copd_diagnosis': [1],            # 1 = Yes (Critical Factor)
    'alcohol_consumption': [1],       # 1 = Yes
    'family_history': [1]             # 1 = Yes
}

# CASE B: 🟢 GOOD / LOW RISK
# Young, never smoked, works in an office, healthy
patient_good = {
    'age': [28],
    'pack_years': [0.0],              # Non-smoker
    'gender': [0],                    # 0 = Female
    'radon_exposure': [0],            # 0 = No
    'asbestos_exposure': [0],         # 0 = No
    'secondhand_smoke_exposure': [0], # 0 = No
    'copd_diagnosis': [0],            # 0 = No
    'alcohol_consumption': [0],       # 0 = No
    'family_history': [0]             # 0 = No
}

# ⚠️ TOGGLE THIS TO TEST DIFFERENT PATIENTS
selected_data = patient_bad  # <--- Change to patient_good to see the healthy result

# ====================================================
# 4. PREPROCESS & FEATURE ENGINEERING
# ====================================================
new_patient_df = pd.DataFrame(selected_data)

# CRITICAL STEP: Calculate the missing column (Model expects this!)
new_patient_df['cumulative_smoking'] = new_patient_df['age'] * new_patient_df['pack_years']

# ====================================================
# 5. PREDICT
# ====================================================
# Scale (Scaler expects 10 columns now)
new_patient_scaled = scaler.transform(new_patient_df)

# Predict
prediction_prob = model.predict(new_patient_scaled)[0][0]

if prediction_prob > THRESHOLD:
    result = "🔴 LUNG CANCER RISK DETECTED"
else:
    result = "🟢 LOW RISK (Healthy)"

# ====================================================
# 6. REPORT
# ====================================================
print("\n" + "="*40)
print(f"🫁 LUNG CANCER REPORT")
print("="*40)
print(f"Input Age:         {selected_data['age'][0]}")
print(f"Input Pack Years:  {selected_data['pack_years'][0]}")
print(f"Calculated Score:  {new_patient_df['cumulative_smoking'].values[0]}")
print("-" * 40)
print(f"Probability Score: {prediction_prob:.4f} ({prediction_prob*100:.1f}%)")
print(f"Final Diagnosis:   {result}")
print("="*40)