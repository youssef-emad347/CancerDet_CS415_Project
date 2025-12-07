import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, View } from 'react-native';
import { Link } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTranslation } from 'react-i18next'; // Added

export default function LoginScreen() {
  const { t } = useTranslation(); // Added
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // router handled by AuthContext
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  // @ts-ignore
  const primaryColor = Colors[theme].primary;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields'); // TODO: Localize this Alert message
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // AuthContext will handle redirection
    } catch (error: any) {
      Alert.alert('Login Failed', error.message); // TODO: Localize this Alert message
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      <ThemedView style={styles.innerContainer}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>{t('auth.welcome')}</ThemedText>
          <ThemedText style={styles.subtitle}>{t('auth.signInContinue')}</ThemedText>
        </View>

        <View style={styles.form}>
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

          <Link href="/(auth)/forgot-password" asChild>
            <TouchableOpacity style={styles.forgotPassword}>
              <ThemedText style={{ color: primaryColor }}>{t('auth.forgotPassword')}</ThemedText>
            </TouchableOpacity>
          </Link>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={handleLogin}
            disabled={loading}>
            <ThemedText style={styles.buttonText}>{loading ? t('auth.signingIn') : t('auth.signIn')}</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <ThemedText>{t('auth.noAccount')} </ThemedText>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <ThemedText type="defaultSemiBold" style={{ color: primaryColor }}>
                {t('auth.signUp')}
              </ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  forgotPassword: {
    alignSelf: 'flex-end',
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
});