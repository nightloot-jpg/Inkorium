import es from '../locales/es.json';

type Translations = typeof es;
type Join<K, P> = K extends string | number ?
    P extends string | number ?
    `${K}${"" extends P ? "" : "."}${P}`
    : never : never;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...0[]]

type Paths<T, D extends number = 10> = [D] extends [never] ? never : T extends object ?
    { [K in keyof T]-?: K extends string | number ?
        `${K}` | Join<K, Paths<T[K], Prev[D]>>
        : never
    }[keyof T] : "";

export type TranslationKeys = Paths<Translations>;

export function useTranslations() {
  const t = (key: TranslationKeys): string => {
    const keys = key.split('.');
    let result: any = es;

    for (const k of keys) {
      if (result === undefined) break;
      result = result[k];
    }

    return result as string || key;
  };

  return { t };
}
