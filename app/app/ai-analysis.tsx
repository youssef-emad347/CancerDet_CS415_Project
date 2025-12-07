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

export default function AiAnalysisScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  // @ts-ignore
  const colors = Colors[theme];

  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'], // Allow PDF and images
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
        setResult(null); // Reset result on new file
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleAnalyze = () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    setResult(null);

    // Mock Analysis Simulation
    setTimeout(() => {
      setAnalyzing(false);
      // Random mock result for demonstration
      const mockResults = [
        "Based on the analysis of the uploaded data, no significant anomalies were detected. Regular check-ups are recommended.",
        "The AI has detected potential early signs of irregularities. It is highly recommended to consult with a specialist for a detailed review.",
        "Analysis Complete. The data indicators are within the normal range. Keep up with your healthy lifestyle!"
      ];
      const randomResult = mockResults[Math.floor(Math.random() * mockResults.length)];
      setResult(randomResult);
    }, 3000);
  };

  return (
    <>
      <Stack.Screen options={{ title: t('ai.title') }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <ThemedView style={styles.container}>
          <ThemedText type="title" style={styles.header}>{t('ai.title')}</ThemedText>
          <ThemedText style={styles.description}>
            {t('ai.description')}
          </ThemedText>

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
                    <ThemedText style={{ color: colors.error, fontSize: 14 }}>{t('ai.remove')}</ThemedText>
                 </TouchableOpacity>
               </View>
             ) : (
               <ThemedText style={{ textAlign: 'center', marginVertical: 12, opacity: 0.6 }}>
                 {t('ai.noFile')}
               </ThemedText>
             )}

             <TouchableOpacity 
               style={[styles.button, { backgroundColor: colors.accent }]} 
               onPress={handleDocumentPick}
               disabled={analyzing}
             >
               <ThemedText style={styles.buttonText}>{selectedFile ? t('ai.changeFile') : t('ai.selectFile')}</ThemedText>
             </TouchableOpacity>
          </View>

          {analyzing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <ThemedText style={{ marginTop: 16 }}>{t('ai.analyzing')}</ThemedText>
            </View>
          )}

          {result && !analyzing && (
            <View style={[styles.resultContainer, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
              <ThemedText type="subtitle" style={{ color: colors.success, marginBottom: 8 }}>{t('ai.result')}</ThemedText>
              <ThemedText style={{ lineHeight: 24 }}>{result}</ThemedText>
            </View>
          )}

          <TouchableOpacity
            style={[
                styles.analyzeButton, 
                { backgroundColor: selectedFile ? colors.primary : colors.icon + '40' }
            ]}
            onPress={handleAnalyze}
            disabled={!selectedFile || analyzing}
          >
            <ThemedText style={styles.buttonText}>{t('ai.startPrediction')}</ThemedText>
          </TouchableOpacity>

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
    marginBottom: 32,
    opacity: 0.7,
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
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  resultContainer: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  }
});