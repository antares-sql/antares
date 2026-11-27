/**
 * Flag shown next to each UI language (flag-icons SVGs, 4:3).
 * Static requires: only these files end up in the bundle.
 * Catalan uses the Catalan flag, not the Spanish one of its locale region.
 * A newly contributed locale missing here gets an empty placeholder in the language select.
 */
const flags: Record<string, string> = {
   'en-US': require('flag-icons/flags/4x3/us.svg'),
   'it-IT': require('flag-icons/flags/4x3/it.svg'),
   'ar-SA': require('flag-icons/flags/4x3/sa.svg'),
   'es-ES': require('flag-icons/flags/4x3/es.svg'),
   'fr-FR': require('flag-icons/flags/4x3/fr.svg'),
   'pt-BR': require('flag-icons/flags/4x3/br.svg'),
   'de-DE': require('flag-icons/flags/4x3/de.svg'),
   'vi-VN': require('flag-icons/flags/4x3/vn.svg'),
   'ja-JP': require('flag-icons/flags/4x3/jp.svg'),
   'zh-CN': require('flag-icons/flags/4x3/cn.svg'),
   'zh-TW': require('flag-icons/flags/4x3/tw.svg'),
   'ru-RU': require('flag-icons/flags/4x3/ru.svg'),
   'id-ID': require('flag-icons/flags/4x3/id.svg'),
   'ko-KR': require('flag-icons/flags/4x3/kr.svg'),
   'nl-NL': require('flag-icons/flags/4x3/nl.svg'),
   'ca-ES': require('flag-icons/flags/4x3/es-ct.svg'),
   'cs-CZ': require('flag-icons/flags/4x3/cz.svg'),
   'uk-UA': require('flag-icons/flags/4x3/ua.svg'),
   'uz-UZ': require('flag-icons/flags/4x3/uz.svg'),
   'he-IL': require('flag-icons/flags/4x3/il.svg'),
   'pl-PL': require('flag-icons/flags/4x3/pl.svg')
};

export const localeFlag = (locale: string): string | undefined => flags[locale];
