import { createI18n } from 'vue-i18n';
import { enUS } from './en-US';
import { itIT } from './it-IT';
import { arSA } from './ar-SA';
import { esES } from './es-ES';
import { frFR } from './fr-FR';
import { ptBR } from './pt-BR';
import { deDE } from './de-DE';
import { viVN } from './vi-VN';
import { jaJP } from './ja-JP';
import { zhCN } from './zh-CN';
import { ruRU } from './ru-RU';
import { idID } from './id-ID';

const messages = {
   'en-US': enUS,
   'it-IT': itIT,
   'ar-SA': arSA,
   'es-ES': esES,
   'fr-FR': frFR,
   'pt-BR': ptBR,
   'de-DE': deDE,
   'vi-VN': viVN,
   'ja-JP': jaJP,
   'zh-CN': zhCN,
   'ru-RU': ruRU,
   'id-ID': idID
};

type NestedPartial<T> = {
   [K in keyof T]?: T[K] extends Array<infer R> ? Array<NestedPartial<R>> : (T[K] extends unknown ? unknown : NestedPartial<T[K]>)
};

export type MessageSchema = typeof enUS
export type AvailableLocale = keyof typeof messages

const i18n = createI18n<[NestedPartial<MessageSchema>], AvailableLocale>({
   fallbackLocale: 'en-US',
   allowComposition: true,
   messages
});

export { i18n };
