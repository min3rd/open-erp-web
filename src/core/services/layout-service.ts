import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  // Sidebar visibility state
  private _sidebarVisible = signal(true);

  // Quick chat visibility state
  private _quickChatVisible = signal(false);

  get sidebarVisible() {
    return this._sidebarVisible.asReadonly();
  }

  get quickChatVisible() {
    return this._quickChatVisible.asReadonly();
  }

  toggleSidebar(): void {
    this._sidebarVisible.update((value) => !value);
  }

  setSidebarVisible(visible: boolean): void {
    this._sidebarVisible.set(visible);
  }

  toggleQuickChat(): void {
    this._quickChatVisible.update((value) => !value);
  }

  setQuickChatVisible(visible: boolean): void {
    this._quickChatVisible.set(visible);
  }
}
