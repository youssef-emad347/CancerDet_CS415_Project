import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View, Switch, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { useAuth } from '@/context/auth';
import { updateUserProfile } from '@/services/user';

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { userProfile, signOut } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const iconColor = theme === 'light' ? Colors.light.icon : Colors.dark.icon;
  // @ts-ignore
  const primaryColor = Colors[theme].primary;
  
  // State for Doctor ID
  const [doctorId, setDoctorId] = useState(
      // @ts-ignore
      userProfile?.doctorId || userProfile?.primaryPhysicianId || ''
  );
  const [isEditingDoctor, setIsEditingDoctor] = useState(false);

  const handleSaveDoctorId = async () => {
      if (!userProfile?.uid) return;
      try {
          await updateUserProfile(userProfile.uid, { doctorId });
          Alert.alert('Success', 'Doctor ID updated.');
          setIsEditingDoctor(false);
      } catch (error) {
          Alert.alert('Error', 'Failed to update Doctor ID');
      }
  };
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  const SettingItem = ({ icon, title, value, onPress, type = 'arrow', rightText }: any) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={type === 'switch'}>
      <View style={styles.settingLeft}>
        <IconSymbol name={icon} size={22} color={iconColor} style={styles.settingIcon} />
        <ThemedText style={styles.settingTitle}>{title}</ThemedText>
      </View>
      {type === 'switch' ? (
        <Switch value={value} onValueChange={onPress} />
      ) : rightText ? (
        <ThemedText style={{ color: Colors[theme].icon, opacity: 0.8 }}>{rightText}</ThemedText>
      ) : (
        <IconSymbol name="chevron.right" size={20} color={Colors[theme].icon + '80'} />
      )}
    </TouchableOpacity>
  );

  const handleLogout = async () => {
      try {
          await signOut();
          // AuthContext handles redirect
      } catch (error) {
          console.error(error);
      }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <Image
          source={{ uri: userProfile?.photoURL || 'https://i.pravatar.cc/300' }}
          style={styles.headerImage}
          contentFit="cover"
        />
      }>
      <View style={styles.profileHeader}>
        <ThemedText type="title">{userProfile?.displayName || 'User'}</ThemedText>
        <ThemedText style={styles.email}>{userProfile?.email}</ThemedText>
        <ThemedView style={[styles.roleBadge, { backgroundColor: primaryColor }]}>
            <ThemedText type="defaultSemiBold" style={styles.roleText}>
                {userProfile?.role === 'doctor' ? t('home.doctor') : t('home.patient')}
            </ThemedText>
        </ThemedView>
      </View>
      
      {/* Doctor Specific: Show their Code */}
      {userProfile?.role === 'doctor' && (
           <View style={styles.section}>
             <ThemedText type="subtitle" style={styles.sectionTitle}>{t('profile.doctorCode')}</ThemedText>
             <ThemedView style={styles.card}>
                 <View style={styles.settingItem}>
                     <View style={styles.settingLeft}>
                         <IconSymbol name="qrcode" size={22} color={iconColor} style={styles.settingIcon} />
                         <ThemedText style={styles.settingTitle}>{t('profile.shareCode')}</ThemedText>
                     </View>
                     <ThemedText type="defaultSemiBold" style={{ color: primaryColor, fontSize: 18 }}>
                         {/* @ts-ignore */}
                         {userProfile.doctorCode || 'N/A'}
                     </ThemedText>
                 </View>
                 <ThemedText style={{ paddingHorizontal: 16, paddingBottom: 12, fontSize: 12, opacity: 0.6 }}>
                     {t('profile.shareCodeDesc')}
                 </ThemedText>
             </ThemedView>
           </View>
      )}

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>{t('profile.account')}</ThemedText>
        <ThemedView style={styles.card}>
          <SettingItem 
            icon="person.fill" 
            title={t('profile.editProfile')}
             onPress={() => router.push('/edit-profile')} // اضف هذا السطر
          />
          <View style={styles.separator} />
          <SettingItem icon="gearshape.fill" title={t('profile.privacy')} 
           onPress={() => router.push('/privacy-security')} />

            
          <View style={styles.separator} />
          {/* <SettingItem icon="house.fill" title={t('profile.address')} /> */}
          <View style={styles.separator} />
          <SettingItem 
            icon="globe" 
            title={t('profile.language')} 
            onPress={toggleLanguage}
            rightText={i18n.language === 'en' ? 'English' : 'العربية'}
          />
        </ThemedView>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>{t('profile.preferences')}</ThemedText>
        <ThemedView style={styles.card}>
          <SettingItem 
            icon="paperplane.fill" 
            title={t('profile.notifications')} 
            type="switch" 
            value={true} 
            onPress={() => {}} 
          />
        </ThemedView>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <ThemedText style={styles.logoutText}>{t('profile.logout')}</ThemedText>
      </TouchableOpacity>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    height: '100%',
    width: '100%',
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -20,
  },
  email: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 4,
  },
  roleBadge: {
      marginTop: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
  },
  roleText: {
      fontSize: 12,
      color: 'white',
      textTransform: 'uppercase',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 10,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ccc',
    opacity: 0.3,
    marginLeft: 50,
  },
  logoutButton: {
    marginTop: 10,
    marginBottom: 40,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#ff3b30', // System Red
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      width: 100,
  }
});
