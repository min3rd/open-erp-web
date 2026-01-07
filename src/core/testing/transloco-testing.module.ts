import {
  provideTransloco,
  TranslocoModule,
  TranslocoTestingModule,
  TranslocoTestingOptions,
} from '@jsverse/transloco';
import { isDevMode } from '@angular/core';

export function getTranslocoModule(options: TranslocoTestingOptions = {}) {
  return TranslocoTestingModule.forRoot({
    langs: {
      en: {},
      es: {},
    },
    translocoConfig: {
      availableLangs: ['en', 'es'],
      defaultLang: 'en',
      reRenderOnLangChange: true,
      prodMode: !isDevMode(),
    },
    preloadLangs: true,
    ...options,
  });
}
