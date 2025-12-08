#%% Lung Cancer - Full Training Pipeline
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.utils import class_weight
import tensorflow as tf
from tensorflow.keras import layers, Sequential
from tensorflow.keras.callbacks import EarlyStopping
import joblib

#%% Load dataset
lc = pd.read_csv(r"E:\Faculty\semster 7\CS 415\CancerDet_CS415_Project\AI\Dataset\lung_cancer_dataset.csv")

#%% Preprocessing
# Fix 'None' values
lc['alcohol_consumption'] = lc['alcohol_consumption'].replace('None', 'None_val')
lc = lc.fillna('None')

# Drop 'patient_id'
if 'patient_id' in lc.columns:
    lc = lc.drop(columns=['patient_id'])

# Create cumulative_smoking column
lc['cumulative_smoking'] = lc['age'] * lc['pack_years']

# Encode ordinal columns manually
ord_mapping = {
    'Low': 0, 'Medium': 1, 'High': 2,
    'None': 0, 'Moderate': 1, 'Heavy': 2
}
for col in ['radon_exposure', 'alcohol_consumption']:
    lc[col] = lc[col].map(ord_mapping)

# Encode remaining categorical columns
le = LabelEncoder()
for col in lc.select_dtypes(include='object').columns:
    lc[col] = le.fit_transform(lc[col])

#%% Split features & target
X = lc.drop('lung_cancer', axis=1)
y = lc['lung_cancer']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

#%% Scale features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Save the new scaler
X = lc.drop('lung_cancer', axis=1)
print("عدد الأعمدة النهائية:", X.shape[1])
print("أسماء الأعمدة بالترتيب:")
print(list(X.columns))


#%% Build the Keras model
model = Sequential([
    layers.Input(shape=(X_train_scaled.shape[1],)),
    layers.Dense(128, activation='relu'),
    layers.Dropout(0.1),
    layers.Dense(64, activation='relu'),
    layers.Dropout(0.1),
    layers.Dense(32, activation='relu'),
    layers.Dense(1, activation='sigmoid')
])

#%% Compile
model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy',
             tf.keras.metrics.Precision(name='precision'),
             tf.keras.metrics.Recall(name='recall'),
             tf.keras.metrics.AUC(name='auc')]
)

#%% Compute class weights
weights = class_weight.compute_class_weight(
    class_weight='balanced',
    classes=np.unique(y_train),
    y=y_train
)
weight_dict = dict(enumerate(weights))

#%% Train
early_stop = EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)

history = model.fit(
    X_train_scaled, y_train,
    epochs=100,
    batch_size=64,
    validation_split=0.2,
    callbacks=[early_stop],
    class_weight=weight_dict,
    verbose=2
)

#%% Save the trained model
model.save(r"E:\Faculty\semster 7\CS 415\CancerDet_CS415_Project\AI\Lung Cancer\Lung_Cancer.keras")
from sklearn.preprocessing import StandardScaler
import joblib

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)  # X_train الجديد بعد كل التجهيزات
joblib.dump(scaler, 'lung_scaler.pkl')


print("Training complete! Model and scaler are saved.")
