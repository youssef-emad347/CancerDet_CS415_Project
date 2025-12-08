#!/usr/bin/env python3
"""
ملفح للتحقق من النماذج وتجربتها
"""

import tensorflow as tf
import joblib
import numpy as np
import os


def check_model(cancer_type, model_path, scaler_path, sample_features=None):
    """التحقق من نموذج معين"""
    print(f"\n🔍 التحقق من نموذج {cancer_type}...")

    # التحقق من وجود الملفات
    if not os.path.exists(model_path):
        print(f"❌ ملف النموذج غير موجود: {model_path}")
        return False

    if not os.path.exists(scaler_path):
        print(f"❌ ملف السكيلر غير موجود: {scaler_path}")
        return False

    try:
        # تحميل النموذج
        model = tf.keras.models.load_model(model_path)
        print(f"✅ تم تحميل النموذج بنجاح")
        print(f"   📊 بنية النموذج: {model.summary()}")

        # تحميل السكيلر
        scaler = joblib.load(scaler_path)
        print(f"✅ تم تحميل السكيلر بنجاح")

        # إذا كانت هناك عينة اختبارية
        if sample_features is not None:
            features = np.array(sample_features).reshape(1, -1)
            scaled_features = scaler.transform(features)
            prediction = model.predict(scaled_features, verbose=0)
            print(f"   🧪 توقع العينة: {prediction[0][0]:.4f}")

        return True

    except Exception as e:
        print(f"❌ خطأ في التحقق: {str(e)}")
        return False


def main():
    """الدالة الرئيسية"""
    print("🔬 فحص نماذج الكشف عن السرطان")
    print("=" * 50)

    # عينات اختبارية (تعديلها حسب كل نموذج)
    breast_sample = [0.1] * 30  # 30 ميزة
    colon_sample = [0.1] * 15  # 15 ميزة
    lung_sample = [0.1] * 9  # 9 ميزات

    # التحقق من النماذج
    models_to_check = [
        ('breast', 'Breast Cancer/Breast_Cancer.keras', 'Breast Cancer/breast_cancer_scaler.pkl', breast_sample),
        ('colon', 'Colorectal Cancer/colon_risk_model.keras', 'Colorectal Cancer/colon_scaler.pkl', colon_sample),
        ('lung', 'Lung Cancer/Lung_Cancer.keras', 'Lung Cancer/Lung_cancer_scaler.pkl', lung_sample)
    ]

    results = []
    for name, model_path, scaler_path, sample in models_to_check:
        result = check_model(name, model_path, scaler_path, sample)
        results.append((name, result))

    print("\n📋 ملخص النتائج:")
    print("-" * 30)
    for name, result in results:
        print(f"{'✅' if result else '❌'} {name}: {'جاهز' if result else 'غير جاهز'}")

    # توصية
    if all(r for _, r in results):
        print("\n🎉 جميع النماذج جاهزة للاستخدام!")
        print("يمكنك تشغيل الخادم باستخدام: python server.py")
    else:
        print("\n⚠️  بعض النماذج تحتاج إلى اهتمام")
        print("يرجى التحقق من مسارات الملفات وتدريب النماذج المفقودة")


if __name__ == '__main__':
    main()