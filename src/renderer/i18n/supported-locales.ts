export const localesNames: Record<string, string> = {
   'en-US': 'English',
   'it-IT': 'Italiano',
   'ar-SA': 'العربية',
   'es-ES': 'Español',
   'fr-FR': 'Français',
   'pt-BR': 'Português (Brasil)',
   'de-DE': 'Deutsch (Deutschland)',
   'vi-VN': 'Tiếng Việt',
   'ja-JP': '日本語',
   'zh-CN': '简体中文',
   'zh-TW': '正體中文',
   'ru-RU': 'Русский',
   'id-ID': 'Bahasa Indonesia',
   'ko-KR': '한국어',
   'nl-NL': 'Nederlands',
   'ca-ES': 'Català',
   'cs-CZ': 'Čeština',
   'uk-UA': 'Українська',
   'uz-UZ': 'O`zbek',
   'he-IL': 'עברית',
   'pl-PL': 'Polski'
};

/** Languages written right to left (the UI is mirrored for them) */
const rtlLanguages = ['ar', 'fa', 'he', 'ur'];

export const localeDirection = (locale: string): 'rtl' | 'ltr' =>
   rtlLanguages.includes(locale.split('-')[0]) ? 'rtl' : 'ltr';
