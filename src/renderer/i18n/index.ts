import { createI18n } from 'vue-i18n';

const i18n = createI18n({
   fallbackLocale: 'en-US',
   messages: {
      'en-US': require('./en-US'),
      'it-IT': require('./it-IT'),
      'ar-SA': require('./ar-SA'),
      'es-ES': require('./es-ES'),
      'fr-FR': require('./fr-FR'),
      'pt-BR': require('./pt-BR'),
      'de-DE': require('./de-DE'),
      'vi-VN': require('./vi-VN'),
      'ja-JP': require('./ja-JP'),
      'zh-CN': require('./zh-CN')
   }
});
export default i18n;
