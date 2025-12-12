import pandas as pd
from sklearn.preprocessing import LabelEncoder
import json
import os

# ==========================================
# 1. LUNG CANCER MAPPINGS (Hybrid Logic)
# ==========================================
print("🫁 Generating Lung Mappings...")
df_lung = pd.read_csv(os.path.join(os.path.dirname(__file__), 'Dataset', 'lung_cancer_dataset.csv')) # <--- CHECK FILENAME

lung_maps = {}

# A. The Manual Map (Ordinal) - EXACTLY AS YOU WROTE
ord_mapping_radon = {'Low': 0, 'Medium': 1, 'High': 2}
ord_mapping_alcohol = {'None': 0, 'Moderate': 1, 'Heavy': 2}

# Save these immediately
lung_maps['radon_exposure'] = ord_mapping_radon
lung_maps['alcohol_consumption'] = ord_mapping_alcohol

# B. The Automatic Map (LabelEncoder) - EXACTLY AS YOU WROTE
# We loop through object columns EXCLUDING the ones we just did manually
# Note: In your code, you mapped them first, so they became numbers. 
# Here, we just pick the columns that need LabelEncoding.
auto_cols = [
    'gender', 
    'asbestos_exposure', 
    'secondhand_smoke_exposure', 
    'copd_diagnosis', 
    'family_history',
    'lung_cancer' # Optional, if you want to save target map
]

for col in auto_cols:
    if col in df_lung.columns:
        le = LabelEncoder()
        le.fit(df_lung[col].astype(str))
        
        # Create map: {'Female': 0, 'Male': 1}
        col_map = dict(zip(le.classes_, le.transform(le.classes_)))
        
        # Ensure python int format
        col_map = {k: int(v) for k, v in col_map.items()}
        lung_maps[col] = col_map
        print(f"   Encoded {col}: {col_map}")

# Save Lung JSON
# Save Lung JSON
lung_json_path = os.path.join(os.path.dirname(__file__), 'Lung Cancer', 'lung_mappings.json')
with open(lung_json_path, 'w') as f:
    json.dump(lung_maps, f, indent=4)
print(f"✅ lung_mappings.json saved to {lung_json_path}")


# ==========================================
# 2. COLORECTAL MAPPINGS (Pure LabelEncoder)
# ==========================================
print("\n🍎 Generating Colorectal Mappings...")
df_colon = pd.read_csv(os.path.join(os.path.dirname(__file__), 'Dataset', 'crc_dataset.csv')) # <--- CHECK FILENAME

colon_maps = {}

colon_cols = [
    'Gender', 'Lifestyle', 'Ethnicity', 
    'Family_History_CRC', 'Pre-existing Conditions'
]

for col in colon_cols:
    if col in df_colon.columns:
        le = LabelEncoder()
        le.fit(df_colon[col].astype(str))
        col_map = dict(zip(le.classes_, le.transform(le.classes_)))
        col_map = {k: int(v) for k, v in col_map.items()}
        colon_maps[col] = col_map
        print(f"   Encoded {col}: {col_map}")

# Save Colon JSON
colon_json_path = os.path.join(os.path.dirname(__file__), 'Colorectal Cancer', 'colon_mappings.json')
with open(colon_json_path, 'w') as f:
    json.dump(colon_maps, f, indent=4)
print(f"✅ colon_mappings.json saved to {colon_json_path}")


# ==========================================
# 3. BREAST CANCER (Manual Target Only)
# ==========================================
# You don't need input mappings for breast, but we can save the target info
# just for documentation.
breast_maps = {
    "diagnosis": {"B": 0, "M": 1}
}
with open('breast_mappings.json', 'w') as f:
    json.dump(breast_maps, f, indent=4)
print("\n✅ breast_mappings.json saved.")

print("\n👉 ACTION: Move 'lung_mappings.json' and 'colon_mappings.json' to your Backend folder.")