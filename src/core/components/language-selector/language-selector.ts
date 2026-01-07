import { ChangeDetectionStrategy, Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';

interface LanguageOption {
  code: string;
  label: string;
  flag: string;
}

@Component({
  selector: 'language-selector',
  imports: [CommonModule, TranslocoModule, DropdownModule, FormsModule],
  templateUrl: './language-selector.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelector {
  private translocoService = inject(TranslocoService);
  private readonly STORAGE_KEY = 'app.language';

  languages: LanguageOption[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
  ];

  selectedLanguage = signal<string>(this.loadLanguage());

  constructor() {
    // Set the initial language
    this.translocoService.setActiveLang(this.selectedLanguage());

    // Persist language changes
    effect(() => {
      const lang = this.selectedLanguage();
      this.saveLanguage(lang);
    });
  }

  onLanguageChange(languageCode: string): void {
    if (languageCode) {
      this.selectedLanguage.set(languageCode);
      this.translocoService.setActiveLang(languageCode);
    }
  }

  private loadLanguage(): string {
    if (typeof window === 'undefined' || !window.localStorage) {
      return 'en';
    }

    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved || 'en';
  }

  private saveLanguage(languageCode: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.STORAGE_KEY, languageCode);
    }
  }
}
