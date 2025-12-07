import { Image } from 'expo-image';
import { StyleSheet, View, TouchableOpacity, Alert, ScrollView, Dimensions, Modal, Pressable } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/auth';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

export default function HomeScreen() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  // @ts-ignore
  const colors = Colors[theme];

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [codeModalVisible, setCodeModalVisible] = useState(false);

  // Mock Data
  const recentActivity = [
    { id: '1', title: 'Consultation with Dr. Smith', subtitle: 'General Checkup', date: 'Oct 24', icon: 'stethoscope' },
    { id: '2', title: 'Blood Test Results', subtitle: 'Pending Review', date: 'Sep 15', icon: 'doc.text.fill' },
    { id: '3', title: t('home.recentPrescription'), subtitle: 'Dr. Sarah Wilson', date: 'Dec 07', icon: 'doc.text' },
  ];

  const upcomingAppointments = [
    { id: '1', doctor: 'Dr. Sarah Wilson', type: 'Cardiology', date: 'Nov 12, 10:00 AM' },
  ];

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setUploadedFiles(prev => [...prev, result.assets[0]]);
        Alert.alert('Success', 'PDF Uploaded Successfully');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleAiAnalysis = () => {
    router.push('/ai-analysis');
  };

  const QuickAction = ({ icon, label, onPress, color }: any) => (
      <TouchableOpacity 
        style={[styles.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }]} 
        onPress={onPress}
      >
          <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
              <IconSymbol name={icon} size={24} color={color} />
          </View>
          <ThemedText style={styles.quickActionLabel} numberOfLines={2}>{label}</ThemedText>
      </TouchableOpacity>
  );

  const InfoCard = ({ title, value, subtext, icon, color }: any) => (
      <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.infoCardHeader}>
              <ThemedText style={[styles.infoCardTitle, { color: colors.secondary }]}>{title}</ThemedText>
              <IconSymbol name={icon} size={16} color={color} />
          </View>
          <ThemedText type="title" style={{ fontSize: 24, marginVertical: 4 }}>{value}</ThemedText>
          {subtext && <ThemedText style={styles.infoCardSubtext}>{subtext}</ThemedText>}
      </View>
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{
        dark: colors.background,
        light: colors.surface,
      }}
      headerImage={
          <View style={[styles.headerContainer, { backgroundColor: colors.primary }]}>
              <View style={styles.headerContent}>
                  <ThemedText style={styles.greetingText}>{t('home.welcome')}</ThemedText>
                  <ThemedText style={styles.nameText}>{userProfile?.displayName || 'User'}</ThemedText>
                  <ThemedText style={styles.roleText}>{userProfile?.role === 'doctor' ? t('home.doctor') : t('home.patient')}</ThemedText>
              </View>
              <IconSymbol name="person.fill" size={80} color="rgba(255,255,255,0.2)" style={styles.headerIcon} />
          </View>
      }
    >
      {/* Modal for Doctor Code */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={codeModalVisible}
        onRequestClose={() => setCodeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalView, { backgroundColor: colors.surface }]}>
            <IconSymbol name="qrcode" size={48} color={colors.primary} />
            <ThemedText type="subtitle" style={{ marginTop: 16, marginBottom: 8 }}>{t('profile.doctorCode')}</ThemedText>
            <ThemedText style={{ textAlign: 'center', opacity: 0.7, marginBottom: 20 }}>
              {t('profile.shareCodeDesc')}
            </ThemedText>
            
            <View style={[styles.codeDisplay, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]}>
              {/* @ts-ignore */}
              <ThemedText type="title" style={{ color: colors.primary, letterSpacing: 2 }}>{userProfile?.doctorCode || '----'}</ThemedText>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={() => setCodeModalVisible(false)}
            >
              <ThemedText style={styles.modalButtonText}>Close</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.contentContainer}>
          
          {/* Upload Data to Predict Section */}
          {userProfile?.role === 'doctor' && (
            <>
              <ThemedText type="subtitle" style={styles.sectionTitle}>{t('home.aiPrediction')}</ThemedText>
              <View style={[styles.aiSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.aiSectionContent}>
                      <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
                        <IconSymbol name="doc.text.fill" size={28} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="defaultSemiBold">{t('home.uploadText')}</ThemedText>
                        <ThemedText style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                          {t('home.uploadDesc')}
                        </ThemedText>
                      </View>
                  </View>
                  <TouchableOpacity 
                    style={[styles.aiActionButton, { backgroundColor: colors.primary }]}
                    onPress={handleAiAnalysis}
                  >
                    <ThemedText style={{ color: 'white', fontWeight: 'bold' }}>{t('home.startAnalysis')}</ThemedText>
                  </TouchableOpacity>
              </View>
            </>
          )}

          {/* Quick Actions Grid */}
          <ThemedText type="subtitle" style={styles.sectionTitle}>{t('home.quickActions')}</ThemedText>
          <View style={styles.quickActionGrid}>
              {userProfile?.role === 'patient' ? (
                  <>
                    <QuickAction 
                        icon="paperplane.fill" 
                        label={t('home.newChat')} 
                        color={colors.primary} 
                        onPress={() => router.push('/(tabs)/chat')} 
                    />
                    <QuickAction 
                        icon="paperclip" 
                        label={t('home.uploadReport')} 
                        color={colors.accent} 
                        onPress={handleDocumentPick} 
                    />
                  </>
              ) : (
                  <>
                     <QuickAction 
                        icon="qrcode" 
                        label={t('home.myCode')} 
                        color={colors.primary} 
                        onPress={() => setCodeModalVisible(true)} 
                    />
                    <QuickAction 
                        icon="message.fill" 
                        label={t('home.patientChats')} 
                        color={colors.success} 
                        onPress={() => router.push('/(tabs)/chat')} 
                    />
                  </>
              )}
          </View>

          {/* Dashboard Stats / Info */}
          <ThemedText type="subtitle" style={styles.sectionTitle}>{t('home.overview')}</ThemedText>
          <View style={styles.infoGrid}>
              {userProfile?.role === 'patient' ? (
                  <>
                    <InfoCard title={t('home.healthScore')} value="92" subtext="Great condition" icon="heart.fill" color="#E11D48" />
                    <InfoCard title={t('home.nextVisit')} value="12 Nov" subtext="Dr. Sarah Wilson" icon="calendar" color={colors.primary} />
                  </>
              ) : (
                  <>
                     <InfoCard title={t('home.patients')} value="14" subtext="+2 this week" icon="person.2.fill" color={colors.primary} />
                     <InfoCard title={t('home.pending')} value="3" subtext="Reports to review" icon="clock.fill" color={colors.accent} />
                  </>
              )}
          </View>

          {/* Recent Activity Section - ONLY FOR PATIENTS */}
          {userProfile?.role === 'patient' && (
            <>
                <ThemedText type="subtitle" style={styles.sectionTitle}>{t('home.recentActivity')}</ThemedText>
                <View style={[styles.listContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
                    {recentActivity.map((item, index) => (
                        <View key={item.id}>
                            <TouchableOpacity style={styles.listItem}>
                                <View style={[styles.listIcon, { backgroundColor: colors.primary + '15' }]}>
                                    {/* @ts-ignore */}
                                    <IconSymbol name={item.icon} size={20} color={colors.primary} />
                                </View>
                                <View style={styles.listContent}>
                                    <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                                    <ThemedText style={[styles.listSubtext, { color: colors.secondary }]}>{item.subtitle}</ThemedText>
                                </View>
                                <ThemedText style={[styles.dateText, { color: colors.secondary }]}>{item.date}</ThemedText>
                            </TouchableOpacity>
                            {index < recentActivity.length - 1 && <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 72 }} />}
                        </View>
                    ))}
                </View>
            </>
          )}

          </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    overflow: 'hidden',
  },
  headerContent: {
      flex: 1,
      zIndex: 1,
  },
  greetingText: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 16,
      marginBottom: 4,
  },
  nameText: {
      color: 'white',
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 4,
  },
  roleText: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 12,
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: '600',
  },
  headerIcon: {
      position: 'absolute',
      right: -10,
      bottom: -10,
      transform: [{ rotate: '-15deg' }],
  },
  contentContainer: {
      padding: 20,
      gap: 24,
  },
  sectionTitle: {
      marginBottom: 12,
      marginLeft: 4,
  },
  quickActionGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      paddingHorizontal: 0, // No horizontal padding here, handled by contentContainer
  },
  quickAction: {
      flex: 1, // Distribute available space equally
      maxWidth: '48%', // Limit max width for two items with gap
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      alignItems: 'center',
      gap: 12,
  },
  quickActionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
  },
  quickActionLabel: {
      fontWeight: '600',
      textAlign: 'center',
      fontSize: 14,
  },
  infoGrid: {
      flexDirection: 'row',
      gap: 12,
  },
  infoCard: {
      flex: 1,
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
  },
  infoCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  infoCardTitle: {
      fontSize: 14,
      fontWeight: '500',
  },
  infoCardSubtext: {
      fontSize: 12,
      opacity: 0.6,
  },
  listContainer: {
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
  },
  listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 16,
  },
  listIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
  },
  listContent: {
      flex: 1,
  },
  listSubtext: {
      fontSize: 13,
      marginTop: 2,
  },
  dateText: {
      fontSize: 12,
      fontWeight: '500',
  },
  aiSection: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  aiSectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiActionButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalView: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  codeDisplay: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
