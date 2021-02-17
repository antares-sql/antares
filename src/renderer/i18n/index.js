import Vue from 'vue';
import VueI18n from 'vue-i18n';

Vue.use(VueI18n);

const i18n = new VueI18n({
   messages: {
      'en-US': require('./en-US'),
      'it-IT': require('./it-IT'),
      'ar-SA': require('./ar-SA'),
      'es-ES': require('./es-ES'),
      'fr-FR': require('./fr-FR')
   }
});
export default i18n;
