import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/auth';
import { updateUserProfile } from '@/services/user';
import { DoctorProfile, PatientProfile } from '@/types/user';

// Validation Schemas
const baseSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
});

const patientSchema = baseSchema.extend({
  medicalHistory: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

const doctorSchema = baseSchema.extend({
  specialty: z.string().min(2, 'Specialty is required'),
  licenseNumber: z.string().min(5, 'License number is required'),
  hospitalAffiliation: z.string().optional(),
});

type ProfileFormValues = {
  displayName: string;
  medicalHistory?: string;
  dateOfBirth?: string;
  specialty?: string;
  licenseNumber?: string;
  hospitalAffiliation?: string;
};

export default function EditProfileScreen() {
  const { userProfile, user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const [loading, setLoading] = useState(false);

  const isDoctor = userProfile?.role === 'doctor';
  const schema = isDoctor ? doctorSchema : patientSchema;

  const { control, handleSubmit, formState: { errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: userProfile?.displayName || '',
      // Patient fields
      medicalHistory: (userProfile as PatientProfile)?.medicalHistory?.join(', ') || '',
      dateOfBirth: (userProfile as PatientProfile)?.dateOfBirth || '',
      // Doctor fields
      specialty: (userProfile as DoctorProfile)?.specialty || '',
      licenseNumber: (userProfile as DoctorProfile)?.licenseNumber || '',
      hospitalAffiliation: (userProfile as DoctorProfile)?.hospitalAffiliation || '',
    }
  });

  const [selectedAvatar, setSelectedAvatar] = useState(userProfile?.photoURL || `https://i.pravatar.cc/300?u=${userProfile?.uid}`);
  
  // Predefined avatars
  const AVATAR_OPTIONS = Array.from({ length: 8 }, (_, i) => `https://i.pravatar.cc/300?img=${i + 1}`);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setLoading(true);
    try {
      const updateData: any = {
        displayName: data.displayName,
        photoURL: selectedAvatar,
      };

      if (isDoctor) {
        updateData.specialty = data.specialty;
        updateData.licenseNumber = data.licenseNumber;
        updateData.hospitalAffiliation = data.hospitalAffiliation;
      } else {
        updateData.dateOfBirth = data.dateOfBirth;
        // Convert comma-separated string back to array
        updateData.medicalHistory = data.medicalHistory ? data.medicalHistory.split(',').map((s: string) => s.trim()) : [];
      }

      await updateUserProfile(user.uid, updateData);
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <ThemedView style={styles.container}>
            <ThemedText type="title" style={styles.header}>Edit Profile</ThemedText>

            <View style={styles.form}>
                
                {/* Avatar Selection */}
                <View style={styles.field}>
                    <ThemedText style={styles.label}>Choose Avatar</ThemedText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarList}>
                        {AVATAR_OPTIONS.map((uri, index) => (
                            <TouchableOpacity 
                                key={index} 
                                onPress={() => setSelectedAvatar(uri)}
                                style={[
                                    styles.avatarOption, 
                                    selectedAvatar === uri && { borderColor: Colors[theme].tint, borderWidth: 3 }
                                ]}
                            >
                                {/* We use View/Image for avatar preview. Assuming React Native Image or Expo Image */}
                                <View style={{ width: 60, height: 60, borderRadius: 30, overflow: 'hidden', backgroundColor: '#ddd' }}>
                                     <Image
                                        source={{ uri }}
                                        style={{ width: '100%', height: '100%' }}
                                        contentFit="cover"
                                     />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.field}>

                    <ThemedText style={styles.label}>Display Name</ThemedText>
                    <Controller
                        control={control}
                        name="displayName"
                        render={({ field: { onChange, value } }) => (
                            <TextInput
                                style={[styles.input, { color: Colors[theme].text, borderColor: Colors[theme].icon + '40' }]}
                                value={value}
                                onChangeText={onChange}
                                placeholder="John Doe"
                                placeholderTextColor={Colors[theme].icon + '80'}
                            />
                        )}
                    />
                    {errors.displayName && <ThemedText style={styles.error}>{String(errors.displayName.message)}</ThemedText>}
                </View>

                {isDoctor ? (
                    <>
                        <View style={styles.field}>
                            <ThemedText style={styles.label}>Specialty</ThemedText>
                            <Controller
                                control={control}
                                name="specialty"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={[styles.input, { color: Colors[theme].text, borderColor: Colors[theme].icon + '40' }]}
                                        value={value}
                                        onChangeText={onChange}
                                        placeholder="Cardiology"
                                        placeholderTextColor={Colors[theme].icon + '80'}
                                    />
                                )}
                            />
                            {errors.specialty && <ThemedText style={styles.error}>{String(errors.specialty.message)}</ThemedText>}
                        </View>
                        <View style={styles.field}>
                            <ThemedText style={styles.label}>License Number</ThemedText>
                            <Controller
                                control={control}
                                name="licenseNumber"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={[styles.input, { color: Colors[theme].text, borderColor: Colors[theme].icon + '40' }]}
                                        value={value}
                                        onChangeText={onChange}
                                        placeholder="MD123456"
                                        placeholderTextColor={Colors[theme].icon + '80'}
                                    />
                                )}
                            />
                             {errors.licenseNumber && <ThemedText style={styles.error}>{String(errors.licenseNumber.message)}</ThemedText>}
                        </View>
                        <View style={styles.field}>
                            <ThemedText style={styles.label}>Hospital Affiliation</ThemedText>
                            <Controller
                                control={control}
                                name="hospitalAffiliation"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={[styles.input, { color: Colors[theme].text, borderColor: Colors[theme].icon + '40' }]}
                                        value={value}
                                        onChangeText={onChange}
                                        placeholder="General Hospital"
                                        placeholderTextColor={Colors[theme].icon + '80'}
                                    />
                                )}
                            />
                        </View>
                    </>
                ) : (
                    <>
                        <View style={styles.field}>
                            <ThemedText style={styles.label}>Date of Birth</ThemedText>
                            <Controller
                                control={control}
                                name="dateOfBirth"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={[styles.input, { color: Colors[theme].text, borderColor: Colors[theme].icon + '40' }]}
                                        value={value}
                                        onChangeText={onChange}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor={Colors[theme].icon + '80'}
                                    />
                                )}
                            />
                        </View>
                        <View style={styles.field}>
                            <ThemedText style={styles.label}>Medical History (comma separated)</ThemedText>
                            <Controller
                                control={control}
                                name="medicalHistory"
                                render={({ field: { onChange, value } }) => (
                                    <TextInput
                                        style={[styles.input, { color: Colors[theme].text, borderColor: Colors[theme].icon + '40' }]}
                                        value={value}
                                        onChangeText={onChange}
                                        placeholder="Allergies, Surgery, etc."
                                        placeholderTextColor={Colors[theme].icon + '80'}
                                    />
                                )}
                            />
                        </View>
                    </>
                )}

                <TouchableOpacity
                    style={[styles.button, { backgroundColor: Colors[theme].tint }]}
                    onPress={handleSubmit(onSubmit)}
                    disabled={loading}>
                    <ThemedText style={styles.buttonText}>{loading ? 'Saving...' : 'Save Changes'}</ThemedText>
                </TouchableOpacity>
            </View>
        </ThemedView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  header: {
    marginBottom: 24,
  },
  form: {
    gap: 20,
  },
  field: {
      gap: 8,
  },
  label: {
      fontSize: 14,
      fontWeight: '600',
      opacity: 0.8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  error: {
      color: 'red',
      fontSize: 12,
  },
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  avatarList: {
      gap: 12,
      paddingBottom: 8,
  },
  avatarOption: {
      borderRadius: 34,
      padding: 2,
      borderWidth: 1,
      borderColor: 'transparent',
  }
});
