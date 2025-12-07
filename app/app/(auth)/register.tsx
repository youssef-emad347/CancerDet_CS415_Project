import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, View, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { createUserProfile } from '../../services/user';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { UserRole } from '@/types/user';
import { useTranslation } from 'react-i18next'; // Added

export default function RegisterScreen() {
  const { t } = useTranslation(); // Added
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [licenseNumber, setLicenseNumber] = useState(''); // For doctors
  const [loading, setLoading] = useState(false);
  
  // router handled by AuthContext
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  // @ts-ignore
  const primaryColor = Colors[theme].primary;

  const handleRegister = async () => {
    if (!email || !password || !name) {
      Alert.alert('Error', 'Please fill in all fields'); // TODO: Localize this Alert message
      return;
    }

    if (role === 'doctor' && !licenseNumber) {
        Alert.alert('Error', 'Doctors must provide a License Number'); // TODO: Localize this Alert message
        return;
    }

    setLoading(true);
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Update Display Name
      await updateProfile(user, { displayName: name });
      
      // 3. Create User Profile
      const profileData: any = {
          uid: user.uid,
          email: user.email || '',
          displayName: name,
          role: role,
          createdAt: Date.now(),
      };

      if (role === 'doctor') {
          profileData.licenseNumber = licenseNumber;
          profileData.specialty = 'General'; // Default
          profileData.isVerified = false; // Pending verification
          // Generate a simple unique 6-character code
          profileData.doctorCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      }

      await createUserProfile(profileData);
      
      Alert.alert('Success', 'Account created successfully!'); // TODO: Localize this Alert message
      // AuthContext will redirect
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message); // TODO: Localize this Alert message
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
      <ThemedView style={styles.innerContainer}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>{t('auth.createAccount')}</ThemedText>
          <ThemedText style={styles.subtitle}>{t('auth.joinUs')}</ThemedText>
        </View>

        <View style={styles.form}>
            <View style={styles.roleContainer}>
                <TouchableOpacity 
                    style={[styles.roleButton, role === 'patient' && { backgroundColor: primaryColor }]}
                    onPress={() => setRole('patient')}>
                    <ThemedText style={[styles.roleText, role === 'patient' && { color: 'white' }]}>{t('auth.patient')}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.roleButton, role === 'doctor' && { backgroundColor: primaryColor }]}
                    onPress={() => setRole('doctor')}>
                    <ThemedText style={[styles.roleText, role === 'doctor' && { color: 'white' }]}>{t('auth.doctor')}</ThemedText>
                </TouchableOpacity>
            </View>

           <View style={[styles.inputContainer, { backgroundColor: Colors[theme].icon + '10' }]}>
            <IconSymbol name="person.fill" size={20} color={Colors[theme].icon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: Colors[theme].text }]}
              placeholder={t('auth.fullName')}
              placeholderTextColor={Colors[theme].icon + '80'}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: Colors[theme].icon + '10' }]}>
            <IconSymbol name="message.fill" size={20} color={Colors[theme].icon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: Colors[theme].text }]}
              placeholder={t('auth.email')}
              placeholderTextColor={Colors[theme].icon + '80'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: Colors[theme].icon + '10' }]}>
             <IconSymbol name="lock.fill" size={20} color={Colors[theme].icon} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: Colors[theme].text }]}
              placeholder={t('auth.password')}
              placeholderTextColor={Colors[theme].icon + '80'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {role === 'doctor' && (
              <View style={[styles.inputContainer, { backgroundColor: Colors[theme].icon + '10' }]}>
                <IconSymbol name="doc.text.fill" size={20} color={Colors[theme].icon} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: Colors[theme].text }]}
                  placeholder={t('auth.licenseNumber')}
                  placeholderTextColor={Colors[theme].icon + '80'}
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                />
              </View>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={handleRegister}
            disabled={loading}>
            <ThemedText style={styles.buttonText}>{loading ? t('auth.creatingAccount') : t('auth.signUp')}</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <ThemedText>{t('auth.alreadyHaveAccount')} </ThemedText>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <ThemedText type="defaultSemiBold" style={{ color: primaryColor }}>
                {t('auth.signIn')}
              </ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
      </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
      flexGrow: 1,
  },
  innerContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.6,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
  roleContainer: {
      flexDirection: 'row',
      marginBottom: 10,
      backgroundColor: 'rgba(150,150,150,0.2)',
      borderRadius: 10,
      padding: 4
  },
  roleButton: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8
  },
  roleText: {
      fontWeight: '600'
  }
});