# في notebook منفصل
import joblib
import tensorflow as tf
import numpy as np

# 1. شغل النموذج على بيانات اختبار
model = tf.keras.models.load_model("Lung Cancer/Lung_Cancer.keras")
scaler = joblib.load("Lung Cancer/lung_scaler.pkl")

# 2. شوف شكل بيانات التدريب (لو عندك sample)
print("Shape expected by scaler:", scaler.n_features_in_)

# 3. جرب بعمل predict على بيانات بسيطة
test_data = np.random.randn(1, scaler.n_features_in_)
scaled = scaler.transform(test_data)
pred = model.predict(scaled)
print("Works?", pred)