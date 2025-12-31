import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { Layout } from './layout';
import { LayoutMenuItem, PrivateLayoutService } from './layout.service';

describe('Layout', () => {
  const menu: LayoutMenuItem[] = [{ label: 'Inbox', icon: 'pi pi-inbox' }];
  const serviceStub: Partial<PrivateLayoutService> = {
    fetchMenu: () => of(menu),
    filterByPermissions: (items: LayoutMenuItem[]) => items,
    flatten: (items: LayoutMenuItem[]) => items,
  };

  beforeAll(() => {
    if (!(globalThis as any).ResizeObserver) {
      (globalThis as any).ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }

    if (!window.matchMedia) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
    }
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Layout],
      providers: [{ provide: PrivateLayoutService, useValue: serviceStub }],
    }).compileComponents();
  });

  it('should create vertical layout by default', async () => {
    const fixture = TestBed.createComponent(Layout);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelector('layout-vertical')).toBeTruthy();
  });

  it('should switch to horizontal layout when requested', async () => {
    const fixture = TestBed.createComponent(Layout);
    fixture.componentRef.setInput('layoutType', 'horizontal');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('layout-horizontal')).toBeTruthy();
  });
});
