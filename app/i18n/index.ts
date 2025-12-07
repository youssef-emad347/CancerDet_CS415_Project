import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'intl-pluralrules';

import en from './en.json';
import ar from './ar.json';

const RESOURCES = {
  en: { translation: en },
  ar: { translation: ar },
};

const LANGUAGE_DETECTOR = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const storedLanguage = await AsyncStorage.getItem('user-language');
      if (storedLanguage) {
        return callback(storedLanguage);
      }
    } catch (error) {
      console.log('Error reading language from async storage', error);
    }
    
    // Fallback to device language
    const deviceLocales = Localization.getLocales();
    const deviceLang = deviceLocales && deviceLocales.length > 0 ? deviceLocales[0].languageCode : 'en';
    // @ts-ignore
    callback(deviceLang);
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem('user-language', language);
    } catch (error) {
      console.log('Error saving language', error);
    }
  },
};

// @ts-ignore
i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: RESOURCES,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
        useSuspense: false,
    }
  });

export default i18n;
