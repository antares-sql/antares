import { createI18n } from 'vue-i18n/dist/vue-i18n.esm-bundler.js';// NOTES: temporary fix to compile error

const i18n = locale => createI18n({
   locale,
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
