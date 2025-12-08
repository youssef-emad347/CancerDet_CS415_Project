import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// أنواع السرطان المتاحة
const CANCER_TYPES = [
  { id: 'breast', label: 'Breast Cancer' },
  { id: 'colorectal', label: 'Colorectal Cancer' },
  { id: 'lung', label: 'Lung Cancer' },
] as const;

type CancerType = typeof CANCER_TYPES[number]['id'];

export default function AiAnalysisScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  // @ts-ignore
  const colors = Colors[theme];

  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [selectedCancerType, setSelectedCancerType] = useState<CancerType | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'], // السماح بالصور وPDF
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
        setResult(null); // إعادة تعيين النتيجة عند اختيار ملف جديد
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleCancerTypeSelect = (cancerType: CancerType) => {
    setSelectedCancerType(cancerType);
    setResult(null); // إعادة تعيين النتيجة عند تغيير نوع السرطان
  };

  const handleAnalyze = () => {
    if (!selectedFile || !selectedCancerType) return;

    setAnalyzing(true);
    setResult(null);

    // محاكاة التحليل (في الواقع سيتم الاتصال بخادم الذكاء الاصطناعي)
    setTimeout(() => {
      setAnalyzing(false);
      
      // نتائج وهمية حسب نوع السرطان
      const mockResults: Record<CancerType, string[]> = {
        breast: [
          "تحليل صورة الثدي: تم اكتشاف كتلة حميدة. يوصى بمتابعة دورية كل 6 أشهر.",
          "تحليل صورة الثدي: تم اكتشاف كتلة مشبوهة. يوصى بإجراء خزعة فورية.",
          "تحليل صورة الثدي: النتائج ضمن المعدل الطبيعي. استمري في الفحص الدوري."
        ],
        colorectal: [
          "تحليل صورة القولون: تم اكتشاف سليلة صغيرة حميدة. يوصى بإزالتها بالمنظار.",
          "تحليل صورة القولون: تم اكتشاف ورم في مرحلة مبكرة. يوصى بالتدخل الجراحي.",
          "تحليل صورة القولون: لا توجد أورام أو سلائل مشبوهة."
        ],
        lung: [
          "تحليل صورة الصدر: تم اكتشاف عقدة رئوية صغيرة. يوصى بالمتابعة بعد 3 أشهر.",
          "تحليل صورة الصدر: تم اكتشاف كتلة مشبوهة. يوصى بإجراء PET-CT.",
          "تحليل صورة الصدر: الرئتان سليمتان بدون أي كتل أو عقد مشبوهة."
        ]
      };

      const typeResults = mockResults[selectedCancerType];
      const randomResult = typeResults[Math.floor(Math.random() * typeResults.length)];
      setResult(randomResult);
    }, 3000);
  };

  const isAnalyzeDisabled = !selectedFile || !selectedCancerType || analyzing;

  return (
    <>
      <Stack.Screen options={{ title: t('ai.title') }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.header}>{t('ai.title')}</ThemedText>
          <ThemedText style={styles.description}>
            {t('ai.description') || "تحميل صورة الأشعة واختيار نوع السرطان للحصول على تحليل ذكي"}
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
                    }
                  ]}
                  onPress={() => handleCancerTypeSelect(cancer.id)}
                  disabled={analyzing}
                >
                  <IconSymbol 
                    name={
                      cancer.id === 'breast' ? 'heart.fill' :
                      cancer.id === 'colorectal' ? 'colon' :
                      'lungs.fill'
                    } 
                    size={20} 
                    color={selectedCancerType === cancer.id ? 'white' : colors.text} 
                  />
                  <ThemedText 
                    style={[
                      styles.cancerTypeText,
                      { color: selectedCancerType === cancer.id ? 'white' : colors.text }
                    ]}
                  >
                    {cancer.label}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* قسم تحميل الملف */}
          <View style={[styles.uploadSection, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
              <IconSymbol name="doc.text.fill" size={40} color={colors.primary} />
            </View>
            
            {selectedFile ? (
              <View style={styles.fileInfo}>
                <ThemedText type="defaultSemiBold" numberOfLines={1}>{selectedFile.name}</ThemedText>
                <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                  {(selectedFile.size ? (selectedFile.size / 1024 / 1024).toFixed(2) : '0')} MB
                </ThemedText>
                <TouchableOpacity onPress={() => setSelectedFile(null)} style={{ marginTop: 8 }}>
                  <ThemedText style={{ color: colors.error, fontSize: 14 }}>{t('ai.remove') || 'إزالة'}</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <ThemedText style={{ textAlign: 'center', marginVertical: 12, opacity: 0.6 }}>
                {t('ai.noFile') || 'لم يتم اختيار ملف'}
              </ThemedText>
            )}

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: colors.accent }]} 
              onPress={handleDocumentPick}
              disabled={analyzing}
            >
              <ThemedText style={styles.buttonText}>
                {selectedFile ? (t('ai.changeFile') || 'تغيير الملف') : (t('ai.selectFile') || 'اختر ملف')}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* حالة التحليل */}
          {analyzing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={{ marginTop: 16 }}>{t('ai.analyzing') || 'جاري التحليل...'}</ThemedText>
              <ThemedText style={{ fontSize: 14, opacity: 0.6, marginTop: 8 }}>
                تحليل {selectedCancerType === 'breast' ? 'سرطان الثدي' : 
                       selectedCancerType === 'colorectal' ? 'سرطان القولون' : 
                       'سرطان الرئة'}
              </ThemedText>
            </View>
          )}

          {/* عرض النتيجة */}
          {result && !analyzing && (
            <View style={[styles.resultContainer, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
              <View style={styles.resultHeader}>
                <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
                <ThemedText type="subtitle" style={{ color: colors.success, marginLeft: 8 }}>
                  {t('ai.result') || 'نتيجة التحليل'}
                </ThemedText>
              </View>
              <ThemedText style={{ lineHeight: 24, marginTop: 12 }}>{result}</ThemedText>
              
              <View style={[styles.resultFooter, { borderTopColor: colors.border }]}>
                <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                  نوع التحليل: {selectedCancerType === 'breast' ? 'سرطان الثدي' : 
                               selectedCancerType === 'colorectal' ? 'سرطان القولون' : 
                               'سرطان الرئة'}
                </ThemedText>
                <ThemedText style={{ fontSize: 12, opacity: 0.6 }}>
                  {new Date().toLocaleDateString()}
                </ThemedText>
              </View>
            </View>
          )}

          {/* زر بدء التحليل */}
          <TouchableOpacity
            style={[
              styles.analyzeButton, 
              { 
                backgroundColor: !isAnalyzeDisabled ? colors.primary : colors.icon + '40',
                opacity: isAnalyzeDisabled ? 0.5 : 1
              }
            ]}
            onPress={handleAnalyze}
            disabled={isAnalyzeDisabled}
          >
            <IconSymbol name="brain.head.profile" size={24} color="white" style={{ marginRight: 8 }} />
            <ThemedText style={styles.buttonText}>{t('ai.startPrediction') || 'بدء التحليل'}</ThemedText>
          </TouchableOpacity>

          {/* تعليمات الاستخدام */}
          {!selectedCancerType && (
            <View style={[styles.tipContainer, { backgroundColor: colors.info + '10' }]}>
              <IconSymbol name="lightbulb.fill" size={20} color={colors.info} />
              <ThemedText style={[styles.tipText, { color: colors.info }]}>
                يرجى اختيار نوع السرطان أولاً، ثم تحميل صورة الأشعة
              </ThemedText>
            </View>
          )}

        </ThemedView>
      </ScrollView>
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
  uploadSection: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  fileInfo: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  analyzeButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    flexDirection: 'row',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 24,
    padding: 20,
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
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
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
});