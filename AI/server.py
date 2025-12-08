from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import joblib
import pandas as pd
import os
import sys

app = Flask(__name__)
CORS(app)  # السماح بطلبات من الواجهة الأمامية

# إعداد المسارات للنماذج
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATHS = {
    'breast': {
        'model': os.path.join(BASE_DIR, 'Breast Cancer', 'Breast_Cancer.keras'),
        'scaler': os.path.join(BASE_DIR, 'Breast Cancer', 'breast_cancer_scaler.pkl'),
        'features': 30  # عدد الميزات بعد إسقاط id و Unnamed:32
    },
    'colon': {
        'model': os.path.join(BASE_DIR, 'Colorectal Cancer', 'colon_risk_model.keras'),
        'scaler': os.path.join(BASE_DIR, 'Colorectal Cancer', 'colon_scaler.pkl'),
        'features': 15  # تأكد من العدد الفعلي
    },
    'lung': {
        'model': os.path.join(BASE_DIR, 'Lung Cancer', 'Lung_Cancer.keras'),
        'scaler': os.path.join(BASE_DIR, 'Lung Cancer', 'Lung_cancer_scaler.pkl'),
        'features': 9  # تأكد من العدد الفعلي
    }
}

# تحميل النماذج والمقاييس (تخزين مؤقت)
models = {}
scalers = {}


def load_models():
    """تحميل جميع النماذج والمقاييس عند بدء التشغيل"""
    print("🚀 جار تحميل النماذج...")

    for cancer_type, paths in MODEL_PATHS.items():
        try:
            # تحميل النموذج
            models[cancer_type] = tf.keras.models.load_model(paths['model'])
            # تحميل السكيلر
            scalers[cancer_type] = joblib.load(paths['scaler'])
            print(f"✅ تم تحميل نموذج {cancer_type} بنجاح")
        except Exception as e:
            print(f"❌ خطأ في تحميل نموذج {cancer_type}: {str(e)}")

    print("✅ تم تحميل جميع النماذج بنجاح!")


# تحميل النماذج عند بدء التطبيق
load_models()


@app.route('/')
def home():
    """الصفحة الرئيسية"""
    return jsonify({
        'message': 'مرحباً بخادم الكشف عن السرطان AI',
        'available_models': list(MODEL_PATHS.keys()),
        'endpoints': {
            '/predict/breast': 'POST - توقع سرطان الثدي',
            '/predict/colon': 'POST - توقع سرطان القولون',
            '/predict/lung': 'POST - توقع سرطان الرئة',
            '/predict/all': 'POST - توقع جميع الأنواع',
            '/models/status': 'GET - حالة النماذج'
        }
    })


@app.route('/predict/<cancer_type>', methods=['POST'])
def predict_single(cancer_type):
    """توقع لنوع واحد من السرطان"""
    if cancer_type not in models:
        return jsonify({'error': f'نموذج {cancer_type} غير متوفر'}), 400

    try:
        # الحصول على البيانات من الطلب
        data = request.json

        if not data or 'features' not in data:
            return jsonify({'error': 'يرجى إرسال مصفوفة features في الجسم'}), 400

        features = np.array(data['features']).reshape(1, -1)

        # التحقق من عدد الميزات
        expected_features = MODEL_PATHS[cancer_type]['features']
        if features.shape[1] != expected_features:
            return jsonify({
                'error': f'عدد الميزات غير صحيح. المتوقع: {expected_features}, المستلم: {features.shape[1]}'
            }), 400

        # تطبيق التطبيع
        scaled_features = scalers[cancer_type].transform(features)

        # التوقع
        prediction_prob = models[cancer_type].predict(scaled_features, verbose=0)[0][0]

        # تطبيق الحد الأدنى المناسب
        thresholds = {
            'breast': 0.2,
            'colon': 0.3,
            'lung': 0.3
        }

        threshold = thresholds.get(cancer_type, 0.5)
        prediction = 1 if prediction_prob > threshold else 0

        # إعداد النتيجة
        confidence = float(prediction_prob) if prediction == 1 else float(1 - prediction_prob)

        return jsonify({
            'cancer_type': cancer_type,
            'prediction': int(prediction),
            'probability': float(prediction_prob),
            'threshold_used': threshold,
            'confidence': confidence,
            'message': 'إيجابي (خطر)' if prediction == 1 else 'سلبي (آمن)'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/predict/all', methods=['POST'])
def predict_all():
    """توقع لجميع أنواع السرطان"""
    try:
        data = request.json

        if not data or 'features' not in data:
            return jsonify({'error': 'يرجى إرسال مصفوفة features في الجسم'}), 400

        results = {}

        for cancer_type in MODEL_PATHS.keys():
            try:
                # إعادة استخدام نفس البيانات أو الحصول على ميزات محددة
                # هنا يمكنك تعديل كيفية استخراج الميزات لكل نوع
                features = np.array(data['features']).reshape(1, -1)

                # قم بقص أو تمديد الميزات حسب الحاجة
                expected_features = MODEL_PATHS[cancer_type]['features']
                if features.shape[1] > expected_features:
                    features = features[:, :expected_features]
                elif features.shape[1] < expected_features:
                    # تعبئة بأصفار إذا لزم الأمر
                    padded = np.zeros((1, expected_features))
                    padded[:, :features.shape[1]] = features
                    features = padded

                # تطبيق التطبيع
                scaled_features = scalers[cancer_type].transform(features)

                # التوقع
                prediction_prob = models[cancer_type].predict(scaled_features, verbose=0)[0][0]

                # تطبيق الحد الأدنى
                thresholds = {
                    'breast': 0.2,
                    'colon': 0.3,
                    'lung': 0.3
                }

                threshold = thresholds.get(cancer_type, 0.5)
                prediction = 1 if prediction_prob > threshold else 0

                results[cancer_type] = {
                    'prediction': int(prediction),
                    'probability': float(prediction_prob),
                    'threshold_used': threshold,
                    'risk_level': 'high' if prediction == 1 else 'low'
                }

            except Exception as e:
                results[cancer_type] = {
                    'error': str(e),
                    'prediction': -1  # قيمة خطأ
                }

        # حساب النتيجة الإجمالية
        positive_count = sum(1 for r in results.values() if isinstance(r, dict) and r.get('prediction', 0) == 1)
        total_count = len([r for r in results.values() if isinstance(r, dict) and 'prediction' in r])

        overall_risk = 'high' if positive_count > 0 else 'low'

        return jsonify({
            'overall_risk': overall_risk,
            'positive_detections': positive_count,
            'total_tests': total_count,
            'results': results
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/models/status', methods=['GET'])
def models_status():
    """الحصول على حالة جميع النماذج"""
    status = {}

    for cancer_type, paths in MODEL_PATHS.items():
        try:
            model_loaded = cancer_type in models and models[cancer_type] is not None
            scaler_loaded = cancer_type in scalers and scalers[cancer_type] is not None

            status[cancer_type] = {
                'model_loaded': model_loaded,
                'scaler_loaded': scaler_loaded,
                'model_path': paths['model'],
                'scaler_path': paths['scaler'],
                'expected_features': paths['features']
            }
        except:
            status[cancer_type] = {
                'model_loaded': False,
                'scaler_loaded': False,
                'error': 'فشل في التحقق'
            }

    return jsonify({
        'status': 'running',
        'models': status,
        'loaded_count': sum(1 for s in status.values() if s.get('model_loaded', False))
    })


@app.route('/reload', methods=['POST'])
def reload_models():
    """إعادة تحميل النماذج"""
    global models, scalers

    try:
        load_models()
        return jsonify({'message': 'تم إعادة تحميل النماذج بنجاح'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("🚀 بدء تشغيل خادم الكشف عن السرطان...")
    print(f"📂 المسار الأساسي: {BASE_DIR}")

    # التحقق من وجود النماذج
    for cancer_type, paths in MODEL_PATHS.items():
        model_exists = os.path.exists(paths['model'])
        scaler_exists = os.path.exists(paths['scaler'])

        print(f"{'✅' if model_exists else '❌'} {cancer_type} model: {paths['model']}")
        print(f"{'✅' if scaler_exists else '❌'} {cancer_type} scaler: {paths['scaler']}")

    app.run(host='0.0.0.0', port=5000, debug=True)