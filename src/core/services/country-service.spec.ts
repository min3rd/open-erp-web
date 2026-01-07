import { TestBed } from '@angular/core/testing';
import { CountryService } from './country-service';

describe('CountryService', () => {
  let service: CountryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CountryService],
    });
    service = TestBed.inject(CountryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllCountries', () => {
    it('should return all countries', () => {
      const countries = service.getAllCountries();
      expect(countries.length).toBeGreaterThan(0);
    });

    it('should return countries with code, name, and flag', () => {
      const countries = service.getAllCountries();
      const firstCountry = countries[0];
      expect(firstCountry).toHaveProperty('code');
      expect(firstCountry).toHaveProperty('name');
      expect(firstCountry).toHaveProperty('flag');
    });

    it('should include Vietnam', () => {
      const countries = service.getAllCountries();
      const vietnam = countries.find((c) => c.code === 'VN');
      expect(vietnam).toBeDefined();
      expect(vietnam?.name).toBe('Vietnam');
    });
  });

  describe('searchCountries', () => {
    it('should return all countries when query is empty', () => {
      const allCountries = service.getAllCountries();
      const searchResults = service.searchCountries('');
      expect(searchResults.length).toBe(allCountries.length);
    });

    it('should filter countries by name', () => {
      const results = service.searchCountries('Vietnam');
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Vietnam');
    });

    it('should filter countries by code', () => {
      const results = service.searchCountries('VN');
      expect(results.length).toBe(1);
      expect(results[0].code).toBe('VN');
    });

    it('should be case insensitive', () => {
      const results = service.searchCountries('vietnam');
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('Vietnam');
    });

    it('should return multiple matches for partial queries', () => {
      const results = service.searchCountries('United');
      expect(results.length).toBeGreaterThan(1);
      expect(results.some((c) => c.name === 'United States')).toBe(true);
      expect(results.some((c) => c.name === 'United Kingdom')).toBe(true);
      expect(results.some((c) => c.name === 'United Arab Emirates')).toBe(true);
    });
  });

  describe('getCountryByCode', () => {
    it('should return country for valid code', () => {
      const country = service.getCountryByCode('VN');
      expect(country).toBeDefined();
      expect(country?.name).toBe('Vietnam');
    });

    it('should return undefined for invalid code', () => {
      const country = service.getCountryByCode('XX');
      expect(country).toBeUndefined();
    });
  });

  describe('isValidCountryCode', () => {
    it('should return true for valid codes', () => {
      expect(service.isValidCountryCode('VN')).toBe(true);
      expect(service.isValidCountryCode('US')).toBe(true);
      expect(service.isValidCountryCode('GB')).toBe(true);
    });

    it('should return false for invalid codes', () => {
      expect(service.isValidCountryCode('XX')).toBe(false);
      expect(service.isValidCountryCode('ZZ')).toBe(false);
    });
  });
});
