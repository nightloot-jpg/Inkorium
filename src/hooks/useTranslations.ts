import { es } from '../locales/es';

// In the future this could be expanded to support multiple languages, context, etc.
type LocaleKeys = typeof es;

function getNestedTranslation(obj: any, path: string): string {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj) || path;
}

export function useTranslations() {
  const t = (key: string): string => {
    return getNestedTranslation(es, key);
  };

  return { t };
}
