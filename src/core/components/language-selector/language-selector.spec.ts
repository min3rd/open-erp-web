import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LanguageSelector } from './language-selector';
import { TranslocoService } from '@jsverse/transloco';
import { getTranslocoModule } from '../../../testing/transloco-testing.module';

describe('LanguageSelector', () => {
  let component: LanguageSelector;
  let fixture: ComponentFixture<LanguageSelector>;
  let translocoService: TranslocoService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [LanguageSelector, getTranslocoModule()],
    }).compileComponents();

    translocoService = TestBed.inject(TranslocoService);
    fixture = TestBed.createComponent(LanguageSelector);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default language (en)', () => {
    expect(component.selectedLanguage()).toBe('en');
  });

  it('should load saved language from localStorage', () => {
    localStorage.setItem('app.language', 'es');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [LanguageSelector, getTranslocoModule()],
    });

    const newFixture = TestBed.createComponent(LanguageSelector);
    const newComponent = newFixture.componentInstance;

    expect(newComponent.selectedLanguage()).toBe('es');
  });

  it('should change language and update transloco service', () => {
    spyOn(translocoService, 'setActiveLang');

    component.onLanguageChange('es');

    expect(component.selectedLanguage()).toBe('es');
    expect(translocoService.setActiveLang).toHaveBeenCalledWith('es');
  });

  it('should persist language to localStorage', async () => {
    component.onLanguageChange('es');

    // Wait for effect to run
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(localStorage.getItem('app.language')).toBe('es');
  });

  it('should have correct language options', () => {
    expect(component.languages.length).toBe(2);
    expect(component.languages[0].code).toBe('en');
    expect(component.languages[1].code).toBe('es');
  });
});
