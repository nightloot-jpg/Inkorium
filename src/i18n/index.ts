import { es } from '../locales/es';
import { en } from '../locales/en';

export const translations = {
  es,
  en,
};

export type Language = keyof typeof translations;
export type Translations = typeof translations.es;
