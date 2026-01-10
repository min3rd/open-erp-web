import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  effect,
  input,
  output,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { Button } from 'primeng/button';
import { Dialog } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { OverlayPanel } from 'primeng/overlaypanel';
import { ToggleButton } from 'primeng/togglebutton';

export interface LanguageOption {
  code: string;
  label: string;
  flagCode: string;
}

@Component({
  selector: 'language-switcher',
  imports: [
    CommonModule,
    TranslocoModule,
    Button,
    Dialog,
    FormsModule,
    InputText,
    OverlayPanel,
    ToggleButton,
  ],
  templateUrl: './language-switcher.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcher {
  private translocoService = inject(TranslocoService);
  private readonly STORAGE_KEY = 'app.lang';

  // Inputs
  mode = input<'sidebar' | 'narrow'>('sidebar');
  languages = input<LanguageOption[]>([
    { code: 'vi', label: 'Tiếng Việt', flagCode: 'VN' },
    { code: 'en', label: 'English', flagCode: 'GB' },
    { code: 'es', label: 'Español', flagCode: 'ES' },
    { code: 'fr', label: 'Français', flagCode: 'FR' },
    { code: 'de', label: 'Deutsch', flagCode: 'DE' },
    { code: 'ja', label: '日本語', flagCode: 'JP' },
    { code: 'ko', label: '한국어', flagCode: 'KR' },
    { code: 'zh', label: '中文', flagCode: 'CN' },
    { code: 'pt', label: 'Português', flagCode: 'PT' },
    { code: 'ru', label: 'Русский', flagCode: 'RU' },
    { code: 'ar', label: 'العربية', flagCode: 'SA' },
    { code: 'hi', label: 'हिन्दी', flagCode: 'IN' },
    { code: 'it', label: 'Italiano', flagCode: 'IT' },
    { code: 'th', label: 'ไทย', flagCode: 'TH' },
  ]);
  current = input<string>(this.loadLanguage());

  // Outputs
  change = output<string>();

  // State
  selectedLanguage = signal<string>(this.loadLanguage());
  showAllLanguagesDialog = signal(false);
  searchQuery = signal('');

  // Computed
  currentLanguageOption = computed(() => {
    const code = this.selectedLanguage();
    return this.languages().find((lang) => lang.code === code) || this.languages()[1];
  });

  primaryLanguages = computed(() => {
    return this.languages().filter((lang) => lang.code === 'vi' || lang.code === 'en');
  });

  filteredLanguages = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.languages();
    return this.languages().filter(
      (lang) => lang.label.toLowerCase().includes(query) || lang.code.toLowerCase().includes(query)
    );
  });

  // Quick toggle between VI and EN
  isVietnamese = computed(() => this.selectedLanguage() === 'vi');

  constructor() {
    // Set the initial language
    this.translocoService.setActiveLang(this.selectedLanguage());

    // Sync with input
    effect(
      () => {
        const inputLang = this.current();
        if (inputLang && inputLang !== this.selectedLanguage()) {
          this.selectedLanguage.set(inputLang);
        }
      },
      { allowSignalWrites: true }
    );

    // Persist language changes and emit event
    effect(() => {
      const lang = this.selectedLanguage();
      this.saveLanguage(lang);
      this.translocoService.setActiveLang(lang);
      this.change.emit(lang);
    });
  }

  getFlagUrl(flagCode: string): string {
    return `https://flagsapi.com/${flagCode}/flat/64.png`;
  }

  togglePrimaryLanguage(): void {
    const newLang = this.isVietnamese() ? 'en' : 'vi';
    this.selectedLanguage.set(newLang);
  }

  selectLanguage(code: string): void {
    this.selectedLanguage.set(code);
    this.showAllLanguagesDialog.set(false);
    this.searchQuery.set('');
  }

  openAllLanguagesDialog(): void {
    this.showAllLanguagesDialog.set(true);
    this.searchQuery.set('');
  }

  closeAllLanguagesDialog(): void {
    this.showAllLanguagesDialog.set(false);
    this.searchQuery.set('');
  }

  private loadLanguage(): string {
    if (typeof window === 'undefined' || !window.localStorage) {
      return 'vi';
    }
    const saved = localStorage.getItem(this.STORAGE_KEY);
    return saved || 'vi';
  }

  private saveLanguage(languageCode: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.STORAGE_KEY, languageCode);
    }
  }
}
