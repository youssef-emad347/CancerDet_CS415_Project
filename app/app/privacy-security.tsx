import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  View,
  Linking,
  Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Keys for SecureStore
const SECURE_STORE_KEYS = {
  BIOMETRICS_ENABLED: 'biometrics_enabled',
  AUTO_LOGOUT: 'auto_logout_minutes',
  TWO_FACTOR_ENABLED: 'two_factor_enabled',
  DATA_SHARING: 'data_sharing',
  DIAGNOSTIC_DATA: 'diagnostic_data',
};

const AUTO_LOCK_OPTIONS = [
  { label: 'Immediately', value: 0 },
  { label: 'After 1 minute', value: 1 },
  { label: 'After 5 minutes', value: 5 },
  { label: 'After 10 minutes', value: 10 },
  { label: 'After 30 minutes', value: 30 },
  { label: 'Never', value: -1 },
];

export default function PrivacySecurityScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const colors = Colors[theme] || Colors.light;

  // State for settings
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);
  const [autoLockEnabled, setAutoLockEnabled] = useState(false);
  const [autoLockMinutes, setAutoLockMinutes] = useState(5);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [dataSharing, setDataSharing] = useState(true);
  const [diagnosticData, setDiagnosticData] = useState(true);
  const [biometricType, setBiometricType] = useState<string>('Biometric');
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  
  // Modal state
  const [showAutoLockModal, setShowAutoLockModal] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    checkBiometricAvailability();
  }, []);

  const loadSettings = async () => {
    try {
      const [
        biometrics,
        autoLogout,
        twoFactor,
        sharing,
        diagnostic,
      ] = await Promise.all([
        SecureStore.getItemAsync(SECURE_STORE_KEYS.BIOMETRICS_ENABLED),
        SecureStore.getItemAsync(SECURE_STORE_KEYS.AUTO_LOGOUT),
        SecureStore.getItemAsync(SECURE_STORE_KEYS.TWO_FACTOR_ENABLED),
        SecureStore.getItemAsync(SECURE_STORE_KEYS.DATA_SHARING),
        SecureStore.getItemAsync(SECURE_STORE_KEYS.DIAGNOSTIC_DATA),
      ]);
      
      setBiometricsEnabled(biometrics === 'true');
      setAutoLockEnabled(autoLogout !== null);
      if (autoLogout) {
        setAutoLockMinutes(parseInt(autoLogout, 10));
      }
      setTwoFactorEnabled(twoFactor === 'true');
      setDataSharing(sharing !== 'false');
      setDiagnosticData(diagnostic !== 'false');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const checkBiometricAvailability = async () => {
    try {
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      
      setIsBiometricAvailable(hasHardware && isEnrolled);
      
      if (hasHardware) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Touch ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
          setBiometricType('Iris');
        }
      }
    } catch (error) {
      console.error('Error checking biometrics:', error);
    }
  };

  const toggleBiometrics = async (value: boolean) => {
    if (value && !isBiometricAvailable) {
      Alert.alert(
        t('privacy.biometricsNotAvailableTitle') || 'Biometrics Not Available',
        t('privacy.biometricsNotAvailableMsg') || 'Biometric authentication is not available on this device.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('privacy.authenticatePrompt') || 'Authenticate to enable biometric login',
        fallbackLabel: t('privacy.usePasscode') || 'Use Passcode',
      });

      if (result.success) {
        setBiometricsEnabled(true);
        await SecureStore.setItemAsync(SECURE_STORE_KEYS.BIOMETRICS_ENABLED, 'true');
      } else {
        Alert.alert(
          t('privacy.authFailedTitle') || 'Authentication Failed',
          t('privacy.authFailedMsg') || 'Could not verify your identity'
        );
      }
    } else {
      setBiometricsEnabled(false);
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.BIOMETRICS_ENABLED, 'false');
    }
  };

  const handleAutoLockSelect = async (minutes: number) => {
    setAutoLockMinutes(minutes);
    if (minutes >= 0) {
      setAutoLockEnabled(true);
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.AUTO_LOGOUT, minutes.toString());
    } else {
      setAutoLockEnabled(false);
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.AUTO_LOGOUT);
    }
    setShowAutoLockModal(false);
  };

  const toggleTwoFactor = async (value: boolean) => {
    setTwoFactorEnabled(value);
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.TWO_FACTOR_ENABLED, value.toString());
    
    if (value) {
      Alert.alert(
        t('privacy.twoFactorEnabledTitle') || 'Two-Factor Authentication',
        t('privacy.twoFactorEnabledMsg') || 'You will need to verify your identity via email when logging in from new devices.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleDataSharing = async (value: boolean) => {
    setDataSharing(value);
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.DATA_SHARING, value.toString());
  };

  const toggleDiagnosticData = async (value: boolean) => {
    setDiagnosticData(value);
    await SecureStore.setItemAsync(SECURE_STORE_KEYS.DIAGNOSTIC_DATA, value.toString());
  };

  const handleExportData = () => {
    Alert.alert(
      t('privacy.exportDataTitle') || 'Export Data',
      t('privacy.exportDataMsg') || 'Your data will be prepared for export. You will receive it via email within 24 hours.',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        { text: t('privacy.export') || 'Export', onPress: () => {
          // Here you would implement actual data export
          Alert.alert(
            t('privacy.exportStartedTitle') || 'Export Started',
            t('privacy.exportStartedMsg') || 'Your data export has been initiated. You will receive an email when it\'s ready.'
          );
        }},
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('privacy.deleteAccountTitle') || 'Delete Account',
      t('privacy.deleteAccountWarning') || 'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        { text: t('privacy.delete') || 'Delete', style: 'destructive', onPress: () => {
          Alert.alert(
            t('privacy.confirmDeleteTitle') || 'Confirm Deletion',
            t('privacy.confirmDeleteMsg') || 'Please enter your password to confirm account deletion.',
            [
              { text: t('common.cancel') || 'Cancel', style: 'cancel' },
              {
                text: t('privacy.confirm') || 'Confirm',
                style: 'destructive',
                onPress: () => {
                  // Implement account deletion logic here
                  Alert.alert(
                    t('privacy.accountDeletedTitle') || 'Account Deleted',
                    t('privacy.accountDeletedMsg') || 'Your account has been scheduled for deletion.'
                  );
                }
              }
            ]
          );
        }},
      ]
    );
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://your-app.com/privacy-policy');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://your-app.com/terms');
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <ThemedText type="subtitle" style={styles.sectionTitle}>{title}</ThemedText>
      <ThemedView style={styles.card}>
        {children}
      </ThemedView>
    </View>
  );

  const renderSettingItem = ({ 
    icon, 
    title, 
    description, 
    rightComponent,
    onPress 
  }: {
    icon: string;
    title: string;
    description?: string;
    rightComponent: React.ReactNode;
    onPress?: () => void;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          {/* <IconSymbol name={icon} size={20} color={colors.primary} /> */}
        </View>
        <View style={styles.settingTextContainer}>
          <ThemedText style={styles.settingTitle}>{title}</ThemedText>
          {description && (
            <ThemedText style={styles.settingDescription}>{description}</ThemedText>
          )}
        </View>
      </View>
      {rightComponent}
    </TouchableOpacity>
  );

  const getAutoLockLabel = () => {
    if (!autoLockEnabled) return t('privacy.never') || 'Never';
    if (autoLockMinutes === 0) return t('privacy.immediately') || 'Immediately';
    return t('privacy.afterMinutes', { minutes: autoLockMinutes }) || `After ${autoLockMinutes} minutes`;
  };

  return (
    <>
      <Stack.Screen options={{ title: t('privacy.title') || 'Privacy & Security' }} />
      <ScrollView style={styles.container}>
        {/* Security Section */}
        {renderSection(t('privacy.security') || 'Security', (
          <>
            {renderSettingItem({
              icon: isBiometricAvailable ? 'touchid' : 'lock.shield',
              title: t('privacy.biometricAuth') || `${biometricType} Authentication`,
              description: isBiometricAvailable 
                ? t('privacy.biometricDesc') || `Use ${biometricType} to unlock the app`
                : t('privacy.biometricNotAvailable') || 'Not available on this device',
              rightComponent: (
                <Switch
                  value={biometricsEnabled}
                  onValueChange={toggleBiometrics}
                  disabled={!isBiometricAvailable}
                />
              ),
            })}
            
            <View style={styles.separator} />
            
            {renderSettingItem({
              icon: 'timer',
              title: t('privacy.autoLock') || 'Auto-Lock',
              description: t('privacy.autoLockDesc') || 'Lock the app after inactivity',
              rightComponent: (
                <TouchableOpacity 
                  style={styles.rightButton}
                  onPress={() => setShowAutoLockModal(true)}
                >
                  <ThemedText style={{ color: colors.primary, marginRight: 4 }}>
                    {getAutoLockLabel()}
                  </ThemedText>
                  <IconSymbol name="chevron.right" size={16} color={colors.primary} />
                </TouchableOpacity>
              ),
              onPress: () => setShowAutoLockModal(true),
            })}
            
            <View style={styles.separator} />
            
            {renderSettingItem({
              icon: 'shield.lefthalf.filled',
              title: t('privacy.twoFactor') || 'Two-Factor Authentication',
              description: t('privacy.twoFactorDesc') || 'Add an extra layer of security',
              rightComponent: (
                <Switch
                  value={twoFactorEnabled}
                  onValueChange={toggleTwoFactor}
                />
              ),
            })}
          </>
        ))}

        {/* Privacy Section */}
        {renderSection(t('privacy.privacy') || 'Privacy', (
          <>
            {renderSettingItem({
              icon: 'chart.bar.fill',
              title: t('privacy.dataSharing') || 'Data Sharing for Research',
              description: t('privacy.dataSharingDesc') || 'Help improve cancer detection algorithms',
              rightComponent: (
                <Switch
                  value={dataSharing}
                  onValueChange={toggleDataSharing}
                />
              ),
            })}
            
            <View style={styles.separator} />
            
            {renderSettingItem({
              icon: 'stethoscope',
              title: t('privacy.diagnosticData') || 'Share Diagnostic Data',
              description: t('privacy.diagnosticDataDesc') || 'Share anonymized medical data for research',
              rightComponent: (
                <Switch
                  value={diagnosticData}
                  onValueChange={toggleDiagnosticData}
                />
              ),
            })}
          </>
        ))}

        {/* Data Management Section */}
        {renderSection(t('privacy.dataManagement') || 'Data Management', (
          <>
            {renderSettingItem({
              icon: 'arrow.down.doc.fill',
              title: t('privacy.exportData') || 'Export My Data',
              description: t('privacy.exportDataDesc') || 'Download all your data',
              rightComponent: (
                <IconSymbol name="arrow.down.circle" size={24} color={colors.primary} />
              ),
              onPress: handleExportData,
            })}
            
            <View style={styles.separator} />
            
            {renderSettingItem({
              icon: 'trash.fill',
              title: t('privacy.deleteAccount') || 'Delete Account',
              description: t('privacy.deleteAccountDesc') || 'Permanently delete your account and data',
              rightComponent: (
                <IconSymbol name="chevron.right" size={20} color={colors.error} />
              ),
              onPress: handleDeleteAccount,
            })}
          </>
        ))}

        {/* Legal Section */}
        {renderSection(t('privacy.legal') || 'Legal', (
          <>
            {renderSettingItem({
              icon: 'doc.text.fill',
              title: t('privacy.privacyPolicy') || 'Privacy Policy',
              rightComponent: (
                <IconSymbol name="arrow.up.right" size={18} color={colors.primary} />
              ),
              onPress: openPrivacyPolicy,
            })}
            
            <View style={styles.separator} />
            
            {renderSettingItem({
              icon: 'checkmark.shield.fill',
              title: t('privacy.terms') || 'Terms of Service',
              rightComponent: (
                <IconSymbol name="arrow.up.right" size={18} color={colors.primary} />
              ),
              onPress: openTermsOfService,
            })}
          </>
        ))}

        <View style={styles.versionContainer}>
          <ThemedText style={styles.versionText}>
            {t('privacy.version') || 'Version'} 1.0.0
          </ThemedText>
          <ThemedText style={styles.buildText}>
            Build 2024.12.01
          </ThemedText>
        </View>
      </ScrollView>

      {/* Auto-Lock Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showAutoLockModal}
        onRequestClose={() => setShowAutoLockModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="subtitle">
                {t('privacy.autoLock') || 'Auto-Lock'}
              </ThemedText>
              <TouchableOpacity onPress={() => setShowAutoLockModal(false)}>
                <IconSymbol name="xmark.circle.fill" size={24} color={colors.icon} />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              {AUTO_LOCK_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    autoLockMinutes === option.value && { backgroundColor: colors.primary + '20' }
                  ]}
                  onPress={() => handleAutoLockSelect(option.value)}
                >
                  <ThemedText style={styles.optionText}>
                    {option.label === 'Immediately' ? t('privacy.immediately') || 'Immediately' :
                     option.label === 'Never' ? t('privacy.never') || 'Never' :
                     option.label}
                  </ThemedText>
                  {autoLockMinutes === option.value && (
                    <IconSymbol name="checkmark.circle.fill" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    paddingVertical: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 60,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ccc',
    opacity: 0.3,
    marginLeft: 60,
  },
  rightButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    padding: 20,
  },
  versionText: {
    fontSize: 14,
    opacity: 0.7,
  },
  buildText: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  optionText: {
    fontSize: 16,
  },
});