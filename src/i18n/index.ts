// i18n configuration placeholder
export const defaultLocale = 'es';
export const supportedLocales = ['es', 'en'] as const;
export type Locale = typeof supportedLocales[number];
