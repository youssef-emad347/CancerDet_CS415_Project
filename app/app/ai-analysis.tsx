import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Switch,
  Dimensions,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { Stack } from 'expo-router';
import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth';
import { incrementPendingReports } from '@/services/user';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

// تحديد عنوان السيرفر تلقائياً
const getApiBaseUrl = () => {
  // الحصول على عنوان المضيف من إعدادات Expo
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(':')[0];

  if (localhost) {
    return `http://${localhost}:8000`;
  }

  // Fallback if not in development or hostUri is undefined
  // Updated to current local IP:
  return 'http://192.168.1.11:8000';
};

const API_BASE_URL = getApiBaseUrl();

// أنواع السرطان المتاحة
const CANCER_TYPES = [
  { id: 'breast', label: 'Breast Cancer' },
  { id: 'colorectal', label: 'Colorectal Cancer' },
  { id: 'lung', label: 'Lung Cancer' },
] as const;

type CancerType = typeof CANCER_TYPES[number]['id'];

// تعريف أنواع البيانات لكل نوع سرطان
interface BreastCancerData {
  radius_mean: string;
  texture_mean: string;
  perimeter_mean: string;
  area_mean: string;
  smoothness_mean: string;
  compactness_mean: string;
  concavity_mean: string;
  concave_points_mean: string;
  symmetry_mean: string;
  fractal_dimension_mean: string;
  radius_se: string;
  texture_se: string;
  perimeter_se: string;
  area_se: string;
  smoothness_se: string;
  compactness_se: string;
  concavity_se: string;
  concave_points_se: string;
  symmetry_se: string;
  fractal_dimension_se: string;
  radius_worst: string;
  texture_worst: string;
  perimeter_worst: string;
  area_worst: string;
  smoothness_worst: string;
  compactness_worst: string;
  concavity_worst: string;
  concave_points_worst: string;
  symmetry_worst: string;
  fractal_dimension_worst: string;
}

interface LungCancerData {
  age: string;
  pack_years: string;
  gender: 'Male' | 'Female';
  radon_exposure: 'High' | 'Low' | 'Unknown';
  cumulative_smoking: string;
  asbestos_exposure: boolean;
  secondhand_smoke_exposure: boolean;
  copd_diagnosis: boolean;
  alcohol_consumption: 'None' | 'Moderate' | 'High';
  family_history: boolean;
}

interface ColorectalCancerData {
  Age: string;
  Gender: 'Male' | 'Female';
  BMI: string;
  Lifestyle: 'Sedentary' | 'Active' | 'Very Active' | 'Smoker';
  Ethnicity: string;
  Family_History_CRC: boolean;
  'Pre-existing Conditions': string;
  'Carbohydrates (g)': string;
  'Proteins (g)': string;
  'Fats (g)': string;
  'Vitamin A (IU)': string;
  'Vitamin C (mg)': string;
  'Iron (mg)': string;
}

interface PredictionResult {
  request_id: string;
  model: string;
  prediction: {
    class: 'positive' | 'negative';
    probability: number;
    risk_level: 'high' | 'medium' | 'low';
    threshold_used: number;
  };
  processing_time_ms: number;
  received_features: any;
}

export default function AiAnalysisScreen() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  // @ts-ignore
  const colors = Colors[theme];

  const [selectedCancerType, setSelectedCancerType] = useState<CancerType | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);

  // بيانات النماذج
  const [breastData, setBreastData] = useState<BreastCancerData>({
    radius_mean: '',
    texture_mean: '',
    perimeter_mean: '',
    area_mean: '',
    smoothness_mean: '',
    compactness_mean: '',
    concavity_mean: '',
    concave_points_mean: '',
    symmetry_mean: '',
    fractal_dimension_mean: '',
    radius_se: '',
    texture_se: '',
    perimeter_se: '',
    area_se: '',
    smoothness_se: '',
    compactness_se: '',
    concavity_se: '',
    concave_points_se: '',
    symmetry_se: '',
    fractal_dimension_se: '',
    radius_worst: '',
    texture_worst: '',
    perimeter_worst: '',
    area_worst: '',
    smoothness_worst: '',
    compactness_worst: '',
    concavity_worst: '',
    concave_points_worst: '',
    symmetry_worst: '',
    fractal_dimension_worst: ''
  });

  const [lungData, setLungData] = useState<LungCancerData>({
    age: '',
    pack_years: '',
    gender: 'Male',
    radon_exposure: 'Unknown',
    cumulative_smoking: '0',
    asbestos_exposure: false,
    secondhand_smoke_exposure: false,
    copd_diagnosis: false,
    alcohol_consumption: 'None',
    family_history: false
  });

  const [colorectalData, setColorectalData] = useState<ColorectalCancerData>({
    Age: '',
    Gender: 'Male',
    BMI: '',
    Lifestyle: 'Sedentary',
    Ethnicity: '',
    Family_History_CRC: false,
    'Pre-existing Conditions': '',
    'Carbohydrates (g)': '',
    'Proteins (g)': '',
    'Fats (g)': '',
    'Vitamin A (IU)': '',
    'Vitamin C (mg)': '',
    'Iron (mg)': ''
  });

  const handleCancerTypeSelect = (cancerType: CancerType) => {
    setSelectedCancerType(cancerType);
    setResult(null);
  };

  // دالة لإعداد البيانات للإرسال بالشكل المطلوب
  const prepareRequestData = (modelName: string, features: any) => {
    return {
      model_name: modelName,
      features: features,
      threshold: 0.3
    };
  };

  // دالة لإرسال البيانات للسيرفر بالشكل المطلوب
  const sendPredictionRequest = async (modelName: string, features: any) => {
    try {
      // استخدم نفس الـ endpoint للجميع أو غيره حسب حاجة السيرفر
      const endpoint = '/predict';

      // إعداد البيانات بالشكل المطلوب
      const requestData = prepareRequestData(modelName, features);

      console.log('Sending request:', JSON.stringify(requestData, null, 2));

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Prediction error:', error);
      throw new Error(`Failed to get prediction: ${error.message}`);
    }
  };

  // دالة للتحقق من صحة البيانات قبل الإرسال
  const validateData = (data: any, cancerType: CancerType): boolean => {
    switch (cancerType) {
      case 'breast':
        // تحقق أن جميع الحقول موجودة وهي أرقام
        for (const [key, value] of Object.entries(data)) {
          if (!value || isNaN(parseFloat(value as string))) {
            Alert.alert(t('ai.errors.dataError'), t('ai.errors.invalidValue', { field: key }));
            return false;
          }
        }
        break;

      case 'lung':
        if (!data.age || !data.pack_years) {
          Alert.alert(t('ai.errors.dataError'), t('ai.errors.missingLung'));
          return false;
        }
        if (isNaN(parseFloat(data.age)) || isNaN(parseFloat(data.pack_years))) {
          Alert.alert(t('ai.errors.dataError'), t('ai.errors.numericLung'));
          return false;
        }
        break;

      case 'colorectal':
        if (!data.Age || !data.BMI) {
          Alert.alert(t('ai.errors.dataError'), t('ai.errors.missingColorectal'));
          return false;
        }
        if (isNaN(parseFloat(data.Age)) || isNaN(parseFloat(data.BMI))) {
          Alert.alert(t('ai.errors.dataError'), t('ai.errors.numericColorectal'));
          return false;
        }
        break;
    }

    return true;
  };

  const handleAnalyze = async () => {
    if (!selectedCancerType) {
      Alert.alert(t('ai.errors.general'), t('ai.errors.selectType'));
      return;
    }

    // تحقق من صحة البيانات
    let dataToSend: any;
    let modelName = '';

    switch (selectedCancerType) {
      case 'breast':
        if (!validateData(breastData, 'breast')) return;
        // تحويل بيانات سرطان الثدي للصيغة المناسبة
        dataToSend = { ...breastData };
        modelName = 'breast';
        break;

      case 'lung':
        if (!validateData(lungData, 'lung')) return;
        // تحويل البيانات الرئوية للصيغة المناسبة تماماً كما في المثال
        dataToSend = {
          age: parseFloat(lungData.age),
          pack_years: parseFloat(lungData.pack_years),
          cumulative_smoking: lungData.cumulative_smoking,
          gender: lungData.gender,
          radon_exposure: lungData.radon_exposure,
          asbestos_exposure: lungData.asbestos_exposure ? 'Yes' : 'No',
          secondhand_smoke_exposure: lungData.secondhand_smoke_exposure ? 'Yes' : 'No',
          copd_diagnosis: lungData.copd_diagnosis ? 'Yes' : 'No',
          alcohol_consumption: lungData.alcohol_consumption,
          family_history: lungData.family_history ? 'Yes' : 'No'
        };
        modelName = 'lung';
        break;

      case 'colorectal':
        if (!validateData(colorectalData, 'colorectal')) return;
        // تحويل بيانات القولون للصيغة المناسبة
        dataToSend = {
          Age: parseFloat(colorectalData.Age),
          Gender: colorectalData.Gender,
          BMI: parseFloat(colorectalData.BMI),
          Lifestyle: colorectalData.Lifestyle,
          Ethnicity: colorectalData.Ethnicity || 'Other',
          Family_History_CRC: colorectalData.Family_History_CRC ? 'Yes' : 'No',
          'Pre-existing Conditions': colorectalData['Pre-existing Conditions'] || 'None',
          'Carbohydrates (g)': parseFloat(colorectalData['Carbohydrates (g)']),
          'Proteins (g)': parseFloat(colorectalData['Proteins (g)']),
          'Fats (g)': parseFloat(colorectalData['Fats (g)']),
          'Vitamin A (IU)': parseFloat(colorectalData['Vitamin A (IU)']),
          'Vitamin C (mg)': parseFloat(colorectalData['Vitamin C (mg)']),
          'Iron (mg)': parseFloat(colorectalData['Iron (mg)'])
        };
        modelName = 'colorectal';
        break;

      default:
        return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      const predictionResult = await sendPredictionRequest(modelName, dataToSend);
      setResult(predictionResult);
    } catch (error: any) {
      Alert.alert(t('ai.errors.analysisError'), error.message || t('ai.errors.serverError'));
    } finally {
      setAnalyzing(false);
    }
  };



  const handlePdfUpload = async (type: CancerType) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileAsset = result.assets[0];
      setAnalyzing(true);

      const formData = new FormData();
      formData.append('type', type);
      formData.append('file', {
        uri: fileAsset.uri,
        name: fileAsset.name,
        type: 'application/pdf'
      } as any);

      const response = await fetch(`${API_BASE_URL}/extract-pdf`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) throw new Error('Failed to extract data');
      const json = await response.json();

      if (json.status === 'success' && json.data) {
        const extracted = json.data;
        let count = 0;

        if (type === 'lung') {
          setLungData(prev => {
            const newData = { ...prev };
            if (extracted.age) newData.age = extracted.age.toString();
            if (extracted.packYears) newData.pack_years = extracted.packYears.toString();
            if (newData.age && newData.pack_years) {
              newData.cumulative_smoking = (parseFloat(newData.age) * parseFloat(newData.pack_years)).toString();
            }

            // Categorical & Boolean
            if (extracted.gender) newData.gender = extracted.gender;
            if (extracted.radon_exposure) newData.radon_exposure = extracted.radon_exposure;
            if (extracted.alcohol_consumption) newData.alcohol_consumption = extracted.alcohol_consumption;
            if (extracted.family_history !== undefined) newData.family_history = extracted.family_history;
            if (extracted.asbestos_exposure !== undefined) newData.asbestos_exposure = extracted.asbestos_exposure;
            if (extracted.secondhand_smoke_exposure !== undefined) newData.secondhand_smoke_exposure = extracted.secondhand_smoke_exposure;
            if (extracted.copd_diagnosis !== undefined) newData.copd_diagnosis = extracted.copd_diagnosis;

            return newData;
          });
          count = Object.keys(extracted).length;
        }
        else if (type === 'colorectal') {
          setColorectalData(prev => {
            const newData = { ...prev };
            if (extracted.age) newData.Age = extracted.age.toString();
            if (extracted.bmi) newData.BMI = extracted.bmi.toString();

            // Categorical
            if (extracted.gender) newData.Gender = extracted.gender;
            if (extracted.lifestyle) newData.Lifestyle = extracted.lifestyle;
            if (extracted.family_history !== undefined) newData.Family_History_CRC = extracted.family_history;

            if (extracted.carbs) newData['Carbohydrates (g)'] = extracted.carbs.toString();
            if (extracted.proteins) newData['Proteins (g)'] = extracted.proteins.toString();
            if (extracted.fats) newData['Fats (g)'] = extracted.fats.toString();
            if (extracted.vitA) newData['Vitamin A (IU)'] = extracted.vitA.toString();
            if (extracted.vitC) newData['Vitamin C (mg)'] = extracted.vitC.toString();
            if (extracted.iron) newData['Iron (mg)'] = extracted.iron.toString();
            return newData;
          });
          count = Object.keys(extracted).length;
        }
        else if (type === 'breast') {
          setBreastData(prev => {
            const newData = { ...prev };
            Object.keys(extracted).forEach(key => {
              if (key in newData) {
                // @ts-ignore
                newData[key] = extracted[key].toString();
              }
            });
            return newData;
          });
          count = Object.keys(extracted).length;
        }

        // Notify Linked Doctor
        if (userProfile?.linkedDoctorId) {
          await incrementPendingReports(userProfile.linkedDoctorId);
        }

        Alert.alert('Success', `Extracted ${count} values from report.`);
      } else {
        Alert.alert('Analysis Failed', 'Could not extract valid data.');
      }

    } catch (error: any) {
      Alert.alert('Error', 'Failed to process PDF: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const renderBreastCancerForm = () => (
    <View style={styles.fullFormContainer}>
      <ThemedText type="subtitle" style={styles.formTitle}>{t('ai.forms.breast.title')}</ThemedText>
      <ThemedText style={styles.formSubtitle}>{t('ai.forms.breast.subtitle')}</ThemedText>

      <TouchableOpacity
        style={[styles.uploadButton, { backgroundColor: colors.tint, marginBottom: 20 }]}
        onPress={() => handlePdfUpload('breast')}
      >
        <IconSymbol name="doc.text" size={20} color="white" style={{ marginRight: 8 }} />
        <ThemedText style={{ color: 'white', fontWeight: '600' }}>
          {t('ai.forms.uploadPdf', 'Upload Medical Report (PDF)')}
        </ThemedText>
      </TouchableOpacity>

      <View style={styles.formGrid}>
        {/* Group 1: Mean Features */}
        <View style={styles.featureGroup}>
          <ThemedText type="defaultSemiBold" style={styles.groupTitle}>{t('ai.forms.breast.groups.mean')}</ThemedText>
          {[
            'radius_mean', 'texture_mean', 'perimeter_mean', 'area_mean', 'smoothness_mean',
            'compactness_mean', 'concavity_mean', 'concave_points_mean', 'symmetry_mean', 'fractal_dimension_mean'
          ].map((key) => (
            <View key={key} style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>{t(`ai.forms.breast.fields.${key}`)}</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                value={breastData[key as keyof BreastCancerData]}
                onChangeText={(text) => setBreastData(prev => ({ ...prev, [key]: text }))}
                placeholder={t('ai.forms.breast.placeholder')}
                placeholderTextColor={colors.icon}
                keyboardType="decimal-pad"
              />
            </View>
          ))}
        </View>

        {/* Group 2: Standard Error Features */}
        <View style={styles.featureGroup}>
          <ThemedText type="defaultSemiBold" style={styles.groupTitle}>{t('ai.forms.breast.groups.se')}</ThemedText>
          {[
            'radius_se', 'texture_se', 'perimeter_se', 'area_se', 'smoothness_se',
            'compactness_se', 'concavity_se', 'concave_points_se', 'symmetry_se', 'fractal_dimension_se'
          ].map((key) => (
            <View key={key} style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>{t(`ai.forms.breast.fields.${key}`)}</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                value={breastData[key as keyof BreastCancerData]}
                onChangeText={(text) => setBreastData(prev => ({ ...prev, [key]: text }))}
                placeholder={t('ai.forms.breast.placeholder')}
                placeholderTextColor={colors.icon}
                keyboardType="decimal-pad"
              />
            </View>
          ))}
        </View>

        {/* Group 3: Worst Features */}
        <View style={styles.featureGroup}>
          <ThemedText type="defaultSemiBold" style={styles.groupTitle}>{t('ai.forms.breast.groups.worst')}</ThemedText>
          {[
            'radius_worst', 'texture_worst', 'perimeter_worst', 'area_worst', 'smoothness_worst',
            'compactness_worst', 'concavity_worst', 'concave_points_worst', 'symmetry_worst', 'fractal_dimension_worst'
          ].map((key) => (
            <View key={key} style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>{t(`ai.forms.breast.fields.${key}`)}</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                value={breastData[key as keyof BreastCancerData]}
                onChangeText={(text) => setBreastData(prev => ({ ...prev, [key]: text }))}
                placeholder={t('ai.forms.breast.placeholder')}
                placeholderTextColor={colors.icon}
                keyboardType="decimal-pad"
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderLungCancerForm = () => (
    <View style={styles.fullFormContainer}>
      <ThemedText type="subtitle" style={styles.formTitle}>{t('ai.forms.lung.title')}</ThemedText>

      <TouchableOpacity
        style={[styles.uploadButton, { backgroundColor: colors.tint, marginBottom: 20 }]}
        onPress={() => handlePdfUpload('lung')}
      >
        <IconSymbol name="doc.text" size={20} color="white" style={{ marginRight: 8 }} />
        <ThemedText style={{ color: 'white', fontWeight: '600' }}>
          {t('ai.forms.uploadPdf', 'Upload Medical Report (PDF)')}
        </ThemedText>
      </TouchableOpacity>

      <View style={styles.formGrid}>
        {/* المعلومات الأساسية */}
        <View style={styles.featureGroup}>
          <ThemedText type="defaultSemiBold" style={styles.groupTitle}>{t('ai.forms.lung.groups.basic')}</ThemedText>

          <View style={styles.formRow}>
            <ThemedText style={styles.inputLabel}>{t('ai.forms.lung.fields.age')}</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              value={lungData.age}
              onChangeText={(text) =>
                setLungData(prev => ({
                  ...prev,
                  age: text,
                  cumulative_smoking: ((parseFloat(text) || 0) * (parseFloat(prev.pack_years) || 0)).toString()
                }))
              }
              placeholder={t('ai.forms.lung.placeholders.age')}
              placeholderTextColor={colors.icon}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formRow}>
            <ThemedText style={styles.inputLabel}>{t('ai.forms.lung.fields.packYears')}</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              value={lungData.pack_years}
              onChangeText={(text) =>
                setLungData(prev => ({
                  ...prev,
                  pack_years: text,
                  cumulative_smoking: ((parseFloat(prev.age) || 0) * (parseFloat(text) || 0)).toString()
                }))
              }
              placeholder={t('ai.forms.lung.placeholders.packYears')}
              placeholderTextColor={colors.icon}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formRow}>
            <ThemedText style={styles.inputLabel}>{t('ai.forms.lung.fields.cumulative')}</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              value={lungData.cumulative_smoking.toString()}
              placeholder="0"
              editable={false}
            />
          </View>

          <View style={styles.formRow}>
            <ThemedText style={styles.inputLabel}>{t('ai.forms.lung.fields.gender')}</ThemedText>
            <View style={styles.radioGroup}>
              {['Male', 'Female'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.radioOption,
                    {
                      backgroundColor: lungData.gender === option ? colors.primary : colors.surface,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setLungData(prev => ({ ...prev, gender: option as 'Male' | 'Female' }))}
                >
                  <ThemedText style={{ color: lungData.gender === option ? 'white' : colors.text }}>
                    {option === 'Male' ? t('ai.forms.lung.options.male') : t('ai.forms.lung.options.female')}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formRow}>
            <ThemedText style={styles.inputLabel}>{t('ai.forms.lung.fields.radon')}</ThemedText>
            <View style={styles.radioGroup}>
              {['Low', 'Medium', 'High'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.radioOption,
                    {
                      backgroundColor: lungData.radon_exposure === option ? colors.primary : colors.surface,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setLungData(prev => ({ ...prev, radon_exposure: option as any }))}
                >
                  <ThemedText style={{ color: lungData.radon_exposure === option ? 'white' : colors.text }}>
                    {option === 'Low' ? t('ai.forms.lung.options.low') : option === 'Medium' ? t('ai.forms.lung.options.medium') : t('ai.forms.lung.options.high')}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* عوامل الخطر */}
        <View style={styles.featureGroup}>
          <ThemedText type="defaultSemiBold" style={styles.groupTitle}>{t('ai.forms.lung.groups.risk')}</ThemedText>

          {[
            { key: 'asbestos_exposure', label: t('ai.forms.lung.fields.asbestos') },
            { key: 'secondhand_smoke_exposure', label: t('ai.forms.lung.fields.secondhand') },
            { key: 'copd_diagnosis', label: t('ai.forms.lung.fields.copd') },
            { key: 'family_history', label: t('ai.forms.lung.fields.history') },
          ].map(({ key, label }) => (
            <View key={key} style={styles.switchRow}>
              <ThemedText style={styles.inputLabel}>{label}</ThemedText>
              <Switch
                value={lungData[key as keyof LungCancerData] as boolean}
                onValueChange={(value) => setLungData(prev => ({ ...prev, [key]: value }))}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          ))}

          <View style={styles.formRow}>
            <ThemedText style={styles.inputLabel}>{t('ai.forms.lung.fields.alcohol')}</ThemedText>
            <View style={styles.radioGroup}>
              {['None', 'Moderate', 'Heavy'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.radioOption,
                    {
                      backgroundColor: lungData.alcohol_consumption === option ? colors.primary : colors.surface,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setLungData(prev => ({ ...prev, alcohol_consumption: option as any }))}
                >
                  <ThemedText style={{ color: lungData.alcohol_consumption === option ? 'white' : colors.text }}>
                    {option === 'None' ? t('ai.forms.lung.options.none') : option === 'Moderate' ? t('ai.forms.lung.options.moderate') : t('ai.forms.lung.options.high')}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderColorectalCancerForm = () => (
    <View style={styles.fullFormContainer}>
      <ThemedText type="subtitle" style={styles.formTitle}>{t('ai.forms.colorectal.title')}</ThemedText>

      <TouchableOpacity
        style={[styles.uploadButton, { backgroundColor: colors.tint, marginBottom: 20 }]}
        onPress={() => handlePdfUpload('colorectal')}
      >
        <IconSymbol name="doc.text" size={20} color="white" style={{ marginRight: 8 }} />
        <ThemedText style={{ color: 'white', fontWeight: '600' }}>
          {t('ai.forms.uploadPdf', 'Upload Medical Report (PDF)')}
        </ThemedText>
      </TouchableOpacity>

      <View style={styles.formGrid}>
        {/* المعلومات الشخصية */}
        <View style={styles.featureGroup}>
          <ThemedText type="defaultSemiBold" style={styles.groupTitle}>{t('ai.forms.colorectal.groups.personal')}</ThemedText>

          <View style={styles.formRow}>
            <ThemedText style={styles.inputLabel}>{t('ai.forms.colorectal.fields.age')}</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              value={colorectalData.Age}
              onChangeText={(text) => setColorectalData(prev => ({ ...prev, Age: text }))}
              placeholder={t('ai.forms.colorectal.placeholders.age')}
              placeholderTextColor={colors.icon}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formRow}>
            <ThemedText style={styles.inputLabel}>{t('ai.forms.colorectal.fields.gender')}</ThemedText>
            <View style={styles.radioGroup}>
              {['Male', 'Female'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.radioOption,
                    {
                      backgroundColor: colorectalData.Gender === option ? colors.primary : colors.surface,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setColorectalData(prev => ({ ...prev, Gender: option as 'Male' | 'Female' }))}
                >
                  <ThemedText style={{ color: colorectalData.Gender === option ? 'white' : colors.text }}>
                    {option === 'Male' ? t('ai.forms.colorectal.options.male') : t('ai.forms.colorectal.options.female')}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formRow}>
            <ThemedText style={styles.inputLabel}>{t('ai.forms.colorectal.fields.bmi')}</ThemedText>
            <TextInput
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
              value={colorectalData.BMI}
              onChangeText={(text) => setColorectalData(prev => ({ ...prev, BMI: text }))}
              placeholder={t('ai.forms.colorectal.placeholders.bmi')}
              placeholderTextColor={colors.icon}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.formRow}>
            <ThemedText style={styles.inputLabel}>{t('ai.forms.colorectal.fields.lifestyle')}</ThemedText>
            <View style={styles.radioGroup}>
              {['Sedentary', 'Moderate Exercise', 'Active', 'Smoker'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.radioOption,
                    {
                      backgroundColor: colorectalData.Lifestyle === option ? colors.primary : colors.surface,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setColorectalData(prev => ({ ...prev, Lifestyle: option as any }))}
                >
                  <ThemedText style={{ color: colorectalData.Lifestyle === option ? 'white' : colors.text }}>
                    {option === 'Sedentary' ? t('ai.forms.colorectal.options.sedentary') : option === 'Moderate Exercise' ? t('ai.forms.colorectal.options.active') : option === 'Active' ? t('ai.forms.colorectal.options.veryActive') : 'Smoker'}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formRow}>
            <ThemedText style={styles.inputLabel}>{t('ai.forms.colorectal.fields.ethnicity')}</ThemedText>
            <View style={styles.pickerContainer}>
              {['African', 'Asian', 'Caucasian', 'Hispanic', 'Other'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.chipOption,
                    {
                      backgroundColor: colorectalData.Ethnicity === option ? colors.primary : colors.surface,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setColorectalData(prev => ({ ...prev, Ethnicity: option }))}
                >
                  <ThemedText style={{ color: colorectalData.Ethnicity === option ? 'white' : colors.text, fontSize: 12 }}>
                    {option}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formRow}>
            <ThemedText style={styles.inputLabel}>{t('ai.forms.colorectal.fields.conditions')}</ThemedText>
            <View style={styles.pickerContainer}>
              {['None', 'Diabetes', 'Other'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.chipOption,
                    {
                      backgroundColor: colorectalData['Pre-existing Conditions'] === option ? colors.primary : colors.surface,
                      borderColor: colors.border
                    }
                  ]}
                  onPress={() => setColorectalData(prev => ({ ...prev, 'Pre-existing Conditions': option }))}
                >
                  <ThemedText style={{ color: colorectalData['Pre-existing Conditions'] === option ? 'white' : colors.text, fontSize: 12 }}>
                    {option}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.switchRow}>
            <ThemedText style={styles.inputLabel}>{t('ai.forms.colorectal.fields.history')}</ThemedText>
            <Switch
              value={colorectalData.Family_History_CRC}
              onValueChange={(value) => setColorectalData(prev => ({ ...prev, Family_History_CRC: value }))}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>

        {/* المعلومات الغذائية */}
        <View style={styles.featureGroup}>
          <ThemedText type="defaultSemiBold" style={styles.groupTitle}>{t('ai.forms.colorectal.groups.nutritional')}</ThemedText>

          {[
            { key: 'Carbohydrates (g)', labelKey: 'carbs' },
            { key: 'Proteins (g)', labelKey: 'proteins' },
            { key: 'Fats (g)', labelKey: 'fats' },
            { key: 'Vitamin A (IU)', labelKey: 'vitA' },
            { key: 'Vitamin C (mg)', labelKey: 'vitC' },
            { key: 'Iron (mg)', labelKey: 'iron' },
          ].map(({ key, labelKey }) => (
            <View key={key} style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>{t(`ai.forms.colorectal.fields.${labelKey}`)}</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.text }]}
                value={colorectalData[key as keyof ColorectalCancerData] as string}
                onChangeText={(text) => setColorectalData(prev => ({ ...prev, [key]: text }))}
                placeholder={t('ai.forms.colorectal.placeholders.generic', { label: t(`ai.forms.colorectal.fields.${labelKey}`) })}
                placeholderTextColor={colors.icon}
                keyboardType="numeric"
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderDataForm = () => {
    if (!selectedCancerType) return null;

    switch (selectedCancerType) {
      case 'breast':
        return renderBreastCancerForm();
      case 'lung':
        return renderLungCancerForm();
      case 'colorectal':
        return renderColorectalCancerForm();
      default:
        return null;
    }
  };

  // عرض النتيجة بشكل جميل
  const renderResult = () => {
    if (!result) return null;

    const { prediction } = result;
    const isPositive = prediction.class === 'positive';
    const resultColor = isPositive ? colors.error : colors.success;
    const riskLevelColors: Record<string, string> = {
      high: colors.error,
      medium: colors.accent,
      low: colors.success
    };

    const getRiskLevelText = (level: string) => {
      switch (level) {
        case 'high': return t('ai.results.levels.high');
        case 'medium': return t('ai.results.levels.medium');
        case 'low': return t('ai.results.levels.low');
        default: return level;
      }
    };

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!result}
        onRequestClose={() => setResult(null)}
      >
        <TouchableWithoutFeedback onPress={() => setResult(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.resultCard, {
                backgroundColor: colors.surface,
                borderColor: resultColor,
                borderWidth: 2
              }]}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setResult(null)}
                >
                  <IconSymbol name="xmark.circle.fill" size={30} color={colors.icon} />
                </TouchableOpacity>

                <View style={styles.resultHeader}>
                  <IconSymbol
                    name={isPositive ? "exclamationmark.triangle.fill" : "checkmark.circle.fill"}
                    size={24}
                    color={resultColor}
                  />
                  <ThemedText type="subtitle" style={{ color: resultColor, marginLeft: 8 }}>
                    {t('ai.results.title')}
                  </ThemedText>
                </View>

                <View style={styles.resultContent}>
                  <View style={styles.resultRow}>
                    <ThemedText style={styles.resultLabel}>{t('ai.results.diagnosis')}</ThemedText>
                    <ThemedText type="defaultSemiBold" style={{ color: resultColor }}>
                      {prediction.class === 'positive' ? t('ai.results.positive') : t('ai.results.negative')}
                    </ThemedText>
                  </View>

                  <View style={styles.resultRow}>
                    <ThemedText style={styles.resultLabel}>{t('ai.results.probability')}</ThemedText>
                    <ThemedText type="defaultSemiBold">
                      {(prediction.probability * 100).toFixed(2)}%
                    </ThemedText>
                  </View>

                  <View style={styles.resultRow}>
                    <ThemedText style={styles.resultLabel}>{t('ai.results.riskLevel')}</ThemedText>
                    <View style={[styles.riskBadge, { backgroundColor: riskLevelColors[prediction.risk_level] + '30' }]}>
                      <ThemedText style={{ color: riskLevelColors[prediction.risk_level] }}>
                        {getRiskLevelText(prediction.risk_level)}
                      </ThemedText>
                    </View>
                  </View>

                  <View style={[styles.resultFooter, { borderTopColor: colors.border }]}>
                    <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                      {t('ai.results.type')} {t(`ai.types.${selectedCancerType}`)}
                    </ThemedText>
                    {/* <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                      {t('ai.results.time', { time: result.processing_time_ms })}
                    </ThemedText> */}
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const isAnalyzeDisabled = !selectedCancerType || analyzing;

  return (
    <>
      <Stack.Screen options={{ title: t('ai.title') }} />

      <View style={{ flex: 1 }}>
        <ThemedView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
            showsVerticalScrollIndicator={true}
          >
            {/* العنوان */}
            <ThemedText type="title" style={styles.header}>
              {t('ai.title')}
            </ThemedText>

            <ThemedText style={styles.description}>
              {t('ai.description')}
            </ThemedText>

            {/* قسم اختيار نوع السرطان */}
            <View style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                {t('ai.chooseType')}
              </ThemedText>
              <View style={styles.cancerTypesContainer}>
                {CANCER_TYPES.map((cancer) => (
                  <TouchableOpacity
                    key={cancer.id}
                    style={[
                      styles.cancerTypeButton,
                      {
                        backgroundColor: selectedCancerType === cancer.id
                          ? colors.primary
                          : colors.surface,
                        borderColor: selectedCancerType === cancer.id
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    onPress={() => handleCancerTypeSelect(cancer.id)}
                    disabled={analyzing}
                  >
                    <ThemedText
                      style={{
                        color: selectedCancerType === cancer.id
                          ? "white"
                          : colors.text,
                      }}
                    >
                      {t(`ai.types.${cancer.id}`)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* الفورم */}
            {selectedCancerType && (
              <View style={{ marginTop: 10 }}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  {t('ai.enterData', { type: t(`ai.types.${selectedCancerType}`) })}
                </ThemedText>
                {renderDataForm()}
              </View>
            )}

            {/* النتيجة */}
            {!analyzing && result && renderResult()}

            {/* Loading indicator */}
            {analyzing && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <ThemedText style={{ marginTop: 16, textAlign: 'center' }}>
                  {t('ai.actions.analyzing')}
                </ThemedText>
              </View>
            )}
          </ScrollView>
        </ThemedView>

        {/* زر التحليل ثابت أسفل الشاشة */}
        <ThemedView style={styles.fixedButtonContainer}>
          <TouchableOpacity
            style={[
              styles.analyzeButton,
              {
                backgroundColor: !isAnalyzeDisabled
                  ? colors.primary
                  : colors.icon + "40",
              },
            ]}
            onPress={handleAnalyze}
            disabled={isAnalyzeDisabled}
          >
            <IconSymbol
              name="brain.head.profile"
              size={24}
              color="white"
              style={{ marginRight: 8 }}
            />
            <ThemedText style={styles.buttonText}>{t('ai.actions.analyze')}</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 24,
    opacity: 0.7,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  cancerTypesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cancerTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minWidth: '30%',
    justifyContent: 'center',
    gap: 8,
  },
  cancerTypeText: {
    fontWeight: '600',
    fontSize: 14,
  },
  thresholdContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  thresholdLabel: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  thresholdInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  fullFormContainer: {
    width: '100%',
  },
  formTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 16,
    textAlign: 'center',
  },
  formScrollView: {
    width: '100%',
  },
  formGrid: {
    width: '100%',
  },
  featureGroup: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  groupTitle: {
    fontSize: 16,
    marginBottom: 16,
    color: '#666',
  },
  formRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  radioOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 4,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  analyzeButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  loadingContainer: {
    marginVertical: 24,
    padding: 20,
    alignItems: 'center',
  },
  resultContainer: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultContent: {
    marginTop: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  resultLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 34,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
});