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
  Dimensions 
} from 'react-native';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width } = Dimensions.get('window');

// عنوان السيرفر - غيره حسب احتياجك
const API_BASE_URL = 'http://192.168.1.6:8000'; // استبدل بعنوان السيرفر الحقيقي
// أو استخدم localhost للتجربة على المحاكي: http://localhost:8000

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
  Lifestyle: 'Sedentary' | 'Active' | 'Very Active';
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
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  // @ts-ignore
  const colors = Colors[theme];

  const [selectedCancerType, setSelectedCancerType] = useState<CancerType | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [threshold, setThreshold] = useState('0.3');
  
  // بيانات النماذج
  const [breastData, setBreastData] = useState<BreastCancerData>({
    radius_mean: '17.99',
    texture_mean: '10.38',
    perimeter_mean: '122.8',
    area_mean: '1001',
    smoothness_mean: '0.1184',
    compactness_mean: '0.2776',
    concavity_mean: '0.3001',
    concave_points_mean: '0.1471',
    symmetry_mean: '0.2419',
    fractal_dimension_mean: '0.07871',
    radius_se: '1.095',
    texture_se: '0.9053',
    perimeter_se: '8.589',
    area_se: '153.4',
    smoothness_se: '0.006399',
    compactness_se: '0.04904',
    concavity_se: '0.05373',
    concave_points_se: '0.01587',
    symmetry_se: '0.03003',
    fractal_dimension_se: '0.006193',
    radius_worst: '25.38',
    texture_worst: '17.33',
    perimeter_worst: '184.6',
    area_worst: '2019',
    smoothness_worst: '0.1622',
    compactness_worst: '0.6656',
    concavity_worst: '0.7119',
    concave_points_worst: '0.2654',
    symmetry_worst: '0.4601',
    fractal_dimension_worst: '0.1189'
  });

  const [lungData, setLungData] = useState<LungCancerData>({
    age: '69',
    pack_years: '66.02524418',
    gender: 'Male',
    radon_exposure: 'High',
    cumulative_smoking: '4555.74184842',
    asbestos_exposure: false,
    secondhand_smoke_exposure: false,
    copd_diagnosis: true,
    alcohol_consumption: 'Moderate',
    family_history: false
  });

  const [colorectalData, setColorectalData] = useState<ColorectalCancerData>({
    Age: '63',
    Gender: 'Female',
    BMI: '21.6',
    Lifestyle: 'Sedentary',
    Ethnicity: 'Hispanic',
    Family_History_CRC: true,
    'Pre-existing Conditions': 'Diabetes',
    'Carbohydrates (g)': '245',
    'Proteins (g)': '98',
    'Fats (g)': '41',
    'Vitamin A (IU)': '4176',
    'Vitamin C (mg)': '97',
    'Iron (mg)': '15.3'
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
      threshold: parseFloat(threshold)
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
            Alert.alert('خطأ في البيانات', `الرجاء إدخال قيمة صحيحة لـ ${key}`);
            return false;
          }
        }
        break;
        
      case 'lung':
        if (!data.age || !data.pack_years) {
          Alert.alert('خطأ في البيانات', 'الرجاء إدخال العمر وسنوات التدخين');
          return false;
        }
        if (isNaN(parseFloat(data.age)) || isNaN(parseFloat(data.pack_years))) {
          Alert.alert('خطأ في البيانات', 'العمر وسنوات التدخين يجب أن يكونا أرقاماً');
          return false;
        }
        break;
        
      case 'colorectal':
        if (!data.Age || !data.BMI) {
          Alert.alert('خطأ في البيانات', 'الرجاء إدخال العمر و BMI');
          return false;
        }
        if (isNaN(parseFloat(data.Age)) || isNaN(parseFloat(data.BMI))) {
          Alert.alert('خطأ في البيانات', 'العمر و BMI يجب أن يكونا أرقاماً');
          return false;
        }
        break;
    }
    
    // تحقق من صحة الـ threshold
    if (isNaN(parseFloat(threshold)) || parseFloat(threshold) < 0 || parseFloat(threshold) > 1) {
      Alert.alert('خطأ في الإعدادات', 'الرجاء إدخال قيمة صحيحة للحد (threshold) بين 0 و 1');
      return false;
    }
    
    return true;
  };

  const handleAnalyze = async () => {
    if (!selectedCancerType) {
      Alert.alert('خطأ', 'الرجاء اختيار نوع السرطان أولاً');
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
      Alert.alert('خطأ في التحليل', error.message || 'حدث خطأ أثناء الاتصال بالسيرفر');
    } finally {
      setAnalyzing(false);
    }
  };

  const renderBreastCancerForm = () => (
    <View style={styles.fullFormContainer}>
      <ThemedText type="subtitle" style={styles.formTitle}>بيانات سرطان الثدي</ThemedText>
      <ThemedText style={styles.formSubtitle}>أدخل القيم العشرية للخصائص التالية:</ThemedText>
      
      <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={true}>
        <View style={styles.formGrid}>
          {/* Group 1: Mean Features */}
          <View style={styles.featureGroup}>
            <ThemedText type="defaultSemiBold" style={styles.groupTitle}>Mean Features</ThemedText>
            {[
              { key: 'radius_mean', label: 'Radius Mean' },
              { key: 'texture_mean', label: 'Texture Mean' },
              { key: 'perimeter_mean', label: 'Perimeter Mean' },
              { key: 'area_mean', label: 'Area Mean' },
              { key: 'smoothness_mean', label: 'Smoothness Mean' },
              { key: 'compactness_mean', label: 'Compactness Mean' },
              { key: 'concavity_mean', label: 'Concavity Mean' },
              { key: 'concave_points_mean', label: 'Concave Points Mean' },
              { key: 'symmetry_mean', label: 'Symmetry Mean' },
              { key: 'fractal_dimension_mean', label: 'Fractal Dimension Mean' },
            ].map(({ key, label }) => (
              <View key={key} style={styles.formRow}>
                <ThemedText style={styles.inputLabel}>{label}</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  value={breastData[key as keyof BreastCancerData]}
                  onChangeText={(text) => setBreastData(prev => ({ ...prev, [key]: text }))}
                  placeholder="أدخل القيمة"
                  keyboardType="decimal-pad"
                />
              </View>
            ))}
          </View>

          {/* Group 2: Standard Error Features */}
          <View style={styles.featureGroup}>
            <ThemedText type="defaultSemiBold" style={styles.groupTitle}>Standard Error Features</ThemedText>
            {[
              { key: 'radius_se', label: 'Radius SE' },
              { key: 'texture_se', label: 'Texture SE' },
              { key: 'perimeter_se', label: 'Perimeter SE' },
              { key: 'area_se', label: 'Area SE' },
              { key: 'smoothness_se', label: 'Smoothness SE' },
              { key: 'compactness_se', label: 'Compactness SE' },
              { key: 'concavity_se', label: 'Concavity SE' },
              { key: 'concave_points_se', label: 'Concave Points SE' },
              { key: 'symmetry_se', label: 'Symmetry SE' },
              { key: 'fractal_dimension_se', label: 'Fractal Dimension SE' },
            ].map(({ key, label }) => (
              <View key={key} style={styles.formRow}>
                <ThemedText style={styles.inputLabel}>{label}</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  value={breastData[key as keyof BreastCancerData]}
                  onChangeText={(text) => setBreastData(prev => ({ ...prev, [key]: text }))}
                  placeholder="أدخل القيمة"
                  keyboardType="decimal-pad"
                />
              </View>
            ))}
          </View>

          {/* Group 3: Worst Features */}
          <View style={styles.featureGroup}>
            <ThemedText type="defaultSemiBold" style={styles.groupTitle}>Worst Features</ThemedText>
            {[
              { key: 'radius_worst', label: 'Radius Worst' },
              { key: 'texture_worst', label: 'Texture Worst' },
              { key: 'perimeter_worst', label: 'Perimeter Worst' },
              { key: 'area_worst', label: 'Area Worst' },
              { key: 'smoothness_worst', label: 'Smoothness Worst' },
              { key: 'compactness_worst', label: 'Compactness Worst' },
              { key: 'concavity_worst', label: 'Concavity Worst' },
              { key: 'concave_points_worst', label: 'Concave Points Worst' },
              { key: 'symmetry_worst', label: 'Symmetry Worst' },
              { key: 'fractal_dimension_worst', label: 'Fractal Dimension Worst' },
            ].map(({ key, label }) => (
              <View key={key} style={styles.formRow}>
                <ThemedText style={styles.inputLabel}>{label}</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  value={breastData[key as keyof BreastCancerData]}
                  onChangeText={(text) => setBreastData(prev => ({ ...prev, [key]: text }))}
                  placeholder="أدخل القيمة"
                  keyboardType="decimal-pad"
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderLungCancerForm = () => (
    <View style={styles.fullFormContainer}>
      <ThemedText type="subtitle" style={styles.formTitle}>بيانات سرطان الرئة</ThemedText>
      
      <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={true}>
        <View style={styles.formGrid}>
          {/* المعلومات الأساسية */}
          <View style={styles.featureGroup}>
            <ThemedText type="defaultSemiBold" style={styles.groupTitle}>المعلومات الأساسية</ThemedText>
            
            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>العمر</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface }]}
                value={lungData.age}
                onChangeText={(text) =>
                  setLungData(prev => ({
                    ...prev,
                    age: text,
                    cumulative_smoking: (parseFloat(text) || 0) * (parseFloat(prev.pack_years) || 0)
                  }))
                }
                placeholder="أدخل العمر"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>سنوات التدخين (Pack Years)</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface }]}
                value={lungData.pack_years}
                onChangeText={(text) =>
                  setLungData(prev => ({
                    ...prev,
                    pack_years: text,
                    cumulative_smoking: (parseFloat(prev.age) || 0) * (parseFloat(text) || 0)
                  }))
                }
                placeholder="أدخل سنوات التدخين"
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>معدل التدخين التراكمي</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface }]}
                value={lungData.cumulative_smoking.toString()}
                placeholder="0"
                editable={false}
              />
            </View>

            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>الجنس</ThemedText>
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
                      {option === 'Male' ? 'ذكر' : 'أنثى'}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>تعرض الرادون</ThemedText>
              <View style={styles.radioGroup}>
                {['High', 'Low', 'Unknown'].map((option) => (
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
                      {option === 'High' ? 'عالي' : option === 'Low' ? 'منخفض' : 'غير معروف'}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* عوامل الخطر */}
          <View style={styles.featureGroup}>
            <ThemedText type="defaultSemiBold" style={styles.groupTitle}>عوامل الخطر</ThemedText>
            
            {[
              { key: 'asbestos_exposure', label: 'تعرض للأسبستوس' },
              { key: 'secondhand_smoke_exposure', label: 'تعرض للتدخين السلبي' },
              { key: 'copd_diagnosis', label: 'تشخيص مرض الانسداد الرئوي' },
              { key: 'family_history', label: 'تاريخ عائلي للمرض' },
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
              <ThemedText style={styles.inputLabel}>استهلاك الكحول</ThemedText>
              <View style={styles.radioGroup}>
                {['None', 'Moderate', 'High'].map((option) => (
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
                      {option === 'None' ? 'لا يوجد' : option === 'Moderate' ? 'معتدل' : 'عالي'}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );

  const renderColorectalCancerForm = () => (
    <View style={styles.fullFormContainer}>
      <ThemedText type="subtitle" style={styles.formTitle}>بيانات سرطان القولون</ThemedText>
      
      <ScrollView style={styles.formScrollView} showsVerticalScrollIndicator={true}>
        <View style={styles.formGrid}>
          {/* المعلومات الشخصية */}
          <View style={styles.featureGroup}>
            <ThemedText type="defaultSemiBold" style={styles.groupTitle}>المعلومات الشخصية</ThemedText>
            
            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>العمر</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface }]}
                value={colorectalData.Age}
                onChangeText={(text) => setColorectalData(prev => ({ ...prev, Age: text }))}
                placeholder="أدخل العمر"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>الجنس</ThemedText>
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
                      {option === 'Male' ? 'ذكر' : 'أنثى'}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>مؤشر كتلة الجسم (BMI)</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface }]}
                value={colorectalData.BMI}
                onChangeText={(text) => setColorectalData(prev => ({ ...prev, BMI: text }))}
                placeholder="أدخل BMI"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>نمط الحياة</ThemedText>
              <View style={styles.radioGroup}>
                {['Sedentary', 'Active', 'Very Active'].map((option) => (
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
                      {option === 'Sedentary' ? 'قليل الحركة' : option === 'Active' ? 'نشيط' : 'نشيط جداً'}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>العرق</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface }]}
                value={colorectalData.Ethnicity}
                onChangeText={(text) => setColorectalData(prev => ({ ...prev, Ethnicity: text }))}
                placeholder="أدخل العرق"
              />
            </View>

            <View style={styles.switchRow}>
              <ThemedText style={styles.inputLabel}>تاريخ عائلي للمرض</ThemedText>
              <Switch
                value={colorectalData.Family_History_CRC}
                onValueChange={(value) => setColorectalData(prev => ({ ...prev, Family_History_CRC: value }))}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={styles.formRow}>
              <ThemedText style={styles.inputLabel}>أمراض سابقة</ThemedText>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface }]}
                value={colorectalData['Pre-existing Conditions']}
                onChangeText={(text) => setColorectalData(prev => ({ ...prev, 'Pre-existing Conditions': text }))}
                placeholder="أدخل الأمراض السابقة"
              />
            </View>
          </View>

          {/* المعلومات الغذائية */}
          <View style={styles.featureGroup}>
            <ThemedText type="defaultSemiBold" style={styles.groupTitle}>المعلومات الغذائية</ThemedText>
            
            {[
              { key: 'Carbohydrates (g)', label: 'الكربوهيدرات (جرام)' },
              { key: 'Proteins (g)', label: 'البروتينات (جرام)' },
              { key: 'Fats (g)', label: 'الدهون (جرام)' },
              { key: 'Vitamin A (IU)', label: 'فيتامين أ (وحدة دولية)' },
              { key: 'Vitamin C (mg)', label: 'فيتامين سي (ملجم)' },
              { key: 'Iron (mg)', label: 'الحديد (ملجم)' },
            ].map(({ key, label }) => (
              <View key={key} style={styles.formRow}>
                <ThemedText style={styles.inputLabel}>{label}</ThemedText>
                <TextInput
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  value={colorectalData[key as keyof ColorectalCancerData] as string}
                  onChangeText={(text) => setColorectalData(prev => ({ ...prev, [key]: text }))}
                  placeholder={`أدخل ${label}`}
                  keyboardType="numeric"
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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

  const renderThresholdInput = () => (
    <View style={styles.thresholdContainer}>
      <ThemedText style={styles.thresholdLabel}>حد التشخيص (Threshold):</ThemedText>
      <TextInput
        style={[styles.thresholdInput, { borderColor: colors.border, backgroundColor: colors.surface }]}
        value={threshold}
        onChangeText={setThreshold}
        placeholder="أدخل قيمة من 0 إلى 1"
        keyboardType="decimal-pad"
      />
    </View>
  );

  // عرض النتيجة بشكل جميل
  const renderResult = () => {
    if (!result) return null;

    const { prediction } = result;
    const isPositive = prediction.class === 'positive';
    const resultColor = isPositive ? colors.error : colors.success;
    const riskLevelColors: Record<string, string> = {
      high: colors.error,
      medium: colors.warning,
      low: colors.success
    };

    const getRiskLevelText = (level: string) => {
      switch (level) {
        case 'high': return 'عالي';
        case 'medium': return 'متوسط';
        case 'low': return 'منخفض';
        default: return level;
      }
    };

    return (
      <View style={[styles.resultContainer, { 
        backgroundColor: resultColor + '15', 
        borderColor: resultColor 
      }]}>
        <View style={styles.resultHeader}>
          <IconSymbol 
            name={isPositive ? "exclamationmark.triangle.fill" : "checkmark.circle.fill"} 
            size={24} 
            color={resultColor} 
          />
          <ThemedText type="subtitle" style={{ color: resultColor, marginLeft: 8 }}>
            نتيجة التحليل
          </ThemedText>
        </View>
        
        <View style={styles.resultContent}>
          <View style={styles.resultRow}>
            <ThemedText style={styles.resultLabel}>التشخيص:</ThemedText>
            <ThemedText type="defaultSemiBold" style={{ color: resultColor }}>
              {prediction.class === 'positive' ? 'إيجابي (خطر)' : 'سلبي (آمن)'}
            </ThemedText>
          </View>
          
          <View style={styles.resultRow}>
            <ThemedText style={styles.resultLabel}>نسبة الاحتمال:</ThemedText>
            <ThemedText type="defaultSemiBold">
              {(prediction.probability * 100).toFixed(2)}%
            </ThemedText>
          </View>
          
          <View style={styles.resultRow}>
            <ThemedText style={styles.resultLabel}>مستوى الخطورة:</ThemedText>
            <View style={[styles.riskBadge, { backgroundColor: riskLevelColors[prediction.risk_level] + '30' }]}>
              <ThemedText style={{ color: riskLevelColors[prediction.risk_level] }}>
                {getRiskLevelText(prediction.risk_level)}
              </ThemedText>
            </View>
          </View>
          
          <View style={styles.resultRow}>
            <ThemedText style={styles.resultLabel}>الحد المستخدم:</ThemedText>
            <ThemedText>{prediction.threshold_used}</ThemedText>
          </View>
          
          <View style={[styles.resultFooter, { borderTopColor: colors.border }]}>
            <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
              نوع التحليل: {selectedCancerType === 'breast' ? 'سرطان الثدي' : 
                           selectedCancerType === 'colorectal' ? 'سرطان القولون' : 
                           'سرطان الرئة'}
            </ThemedText>
            <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
              الوقت: {result.processing_time_ms} مللي ثانية
            </ThemedText>
          </View>
        </View>
      </View>
    );
  };

  const isAnalyzeDisabled = !selectedCancerType || analyzing;

  return (
    <>
      <Stack.Screen options={{ title: t('ai.title') }} />

      <View style={{ flex: 1 }}>
        <ThemedView style={styles.container}>

          {/* العنوان */}
          <ThemedText type="title" style={styles.header}>
            {t('ai.title')}
          </ThemedText>

          <ThemedText style={styles.description}>
            اختر نوع السرطان وأدخل البيانات للحصول على تحليل ذكي
          </ThemedText>

          {/* قسم اختيار نوع السرطان */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              اختر نوع السرطان للتحليل
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
                    {cancer.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* إعدادات الـ threshold */}
          {selectedCancerType && renderThresholdInput()}

          {/* الفورم Scroll فقط */}
          {selectedCancerType && (
            <View
              style={{
                flex: 1,
                marginTop: 10,
                maxHeight: 400,
              }}
            >
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                أدخل بيانات{" "}
                {selectedCancerType === "breast"
                  ? "سرطان الثدي"
                  : selectedCancerType === "colorectal"
                  ? "سرطان القولون"
                  : "سرطان الرئة"}
              </ThemedText>

              <ScrollView
                style={{ flex: 1, marginTop: 12 }}
                contentContainerStyle={{
                  paddingBottom: 120,
                }}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {renderDataForm()}
              </ScrollView>
            </View>
          )}

          {/* النتيجة */}
          {!analyzing && result && renderResult()}
          
          {/* Loading indicator */}
          {analyzing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={{ marginTop: 16, textAlign: 'center' }}>
                جاري التحليل...
              </ThemedText>
            </View>
          )}
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
            <ThemedText style={styles.buttonText}>بدء التحليل</ThemedText>
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
    paddingBottom: 120,
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
    maxHeight: 400,
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
});