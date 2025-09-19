import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import translationEn from './translation.en.json';
import { getCookie } from 'cookies-next';

const resource = {
  en: {
    translation: translationEn,
  },
};

i18n.use(initReactI18next).init({
  resources: resource,
  // 초기 설정 언어
  lng: getCookie('keficoSaveLanguage') === 'EN' ? 'en' : 'ko',
  fallbackLng: 'ko',
  debug: false,
  keySeparator: '.',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
