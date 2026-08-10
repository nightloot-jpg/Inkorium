import { useState, useEffect } from 'react';
import { useCallback } from 'react';
import { translations } from '../i18n';
import type { Translations } from '../i18n';
import { useUiStore } from '../stores/uiStore'; // We will create this in the next step

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<Translations>;

export function useTranslations() {

  const storeLanguage = useUiStore((state) => state.language);
  const [language, setLanguage] = useState<'es' | 'en'>('es');
  useEffect(() => {
    setLanguage(storeLanguage);
  }, [storeLanguage]);


  const t = useCallback(
    (key: TranslationKey): string => {
      const keys = key.split('.');
      let current: any = translations[language];

      for (const k of keys) {
        if (current[k] === undefined) {
          console.warn(`Translation key not found: ${key}`);
          return key;
        }
        current = current[k];
      }

      return current as string;
    },
    [language]
  );

  return { t, language };
}
