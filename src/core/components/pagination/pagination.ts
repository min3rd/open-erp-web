import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { PAGE_SIZE_OPTIONS } from '../../constant';

export interface PaginationChange {
  page: number;
  pageSize: number;
}

@Component({
  selector: 'core-pagination',
  imports: [CommonModule, FormsModule, TranslocoModule, ButtonModule, Select],
  templateUrl: './pagination.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  totalRecords = input<number>(0);
  currentPage = input<number>(1);
  pageSize = input<number>(PAGE_SIZE_OPTIONS[0]);
  pageLinkSize = input<number>(5);
  idPrefix = input<string>('pagination');

  pageChange = output<PaginationChange>();
  navigateTo = output<number>();
  changePageSize = output<number>();

  protected readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalRecords() / this.pageSize()))
  );

  protected readonly currentPageValue = computed(() => {
    const page = this.currentPage();
    return Math.min(Math.max(page || 1, 1), this.totalPages());
  });

  protected readonly isFirstPage = computed(() => this.currentPageValue() <= 1);
  protected readonly isLastPage = computed(() => this.currentPageValue() >= this.totalPages());

  protected readonly pageNumbers = computed(() => {
    const totalPages = this.totalPages();
    const currentPage = this.currentPageValue();
    const linkSize = Math.max(1, this.pageLinkSize());
    const half = Math.floor(linkSize / 2);

    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + linkSize - 1);
    start = Math.max(1, end - linkSize + 1);

    const pages: number[] = [];
    for (let page = start; page <= end; page += 1) {
      pages.push(page);
    }
    return pages;
  });

  protected readonly paginationId = computed(() => `${this.idPrefix()}-pagination`);
  protected readonly firstButtonId = computed(() => `${this.idPrefix()}-pagination-first-button`);
  protected readonly prevButtonId = computed(() => `${this.idPrefix()}-pagination-prev-button`);
  protected readonly nextButtonId = computed(() => `${this.idPrefix()}-pagination-next-button`);
  protected readonly lastButtonId = computed(() => `${this.idPrefix()}-pagination-last-button`);
  protected readonly pageSizeId = computed(() => `${this.idPrefix()}-pagination-page-size`);
  protected readonly pageSizeLabelId = computed(
    () => `${this.idPrefix()}-pagination-page-size-label`
  );

  protected getPageButtonId(page: number): string {
    return `${this.idPrefix()}-pagination-page-${page}`;
  }

  protected onFirstPage(): void {
    if (this.isFirstPage()) {
      return;
    }
    this.emitChange(1, this.pageSize());
  }

  protected onPreviousPage(): void {
    if (this.isFirstPage()) {
      return;
    }
    this.emitChange(this.currentPageValue() - 1, this.pageSize());
  }

  protected onNextPage(): void {
    if (this.isLastPage()) {
      return;
    }
    this.emitChange(this.currentPageValue() + 1, this.pageSize());
  }

  protected onLastPage(): void {
    if (this.isLastPage()) {
      return;
    }
    this.emitChange(this.totalPages(), this.pageSize());
  }

  protected onPageSelect(page: number): void {
    if (page === this.currentPageValue()) {
      return;
    }
    this.emitChange(page, this.pageSize());
  }

  protected onPageSizeSelect(event: { value: number }): void {
    const newPageSize = event.value;
    if (!newPageSize || newPageSize === this.pageSize()) {
      return;
    }
    const firstItemIndex = (this.currentPageValue() - 1) * this.pageSize() + 1;
    const targetPage = Math.ceil(firstItemIndex / newPageSize);
    this.changePageSize.emit(newPageSize);
    this.emitChange(targetPage, newPageSize);
  }

  private emitChange(page: number, pageSize: number): void {
    const totalPages = Math.max(1, Math.ceil(this.totalRecords() / pageSize));
    const targetPage = Math.min(Math.max(page, 1), totalPages);
    if (targetPage === this.currentPageValue() && pageSize === this.pageSize()) {
      return;
    }
    this.pageChange.emit({ page: targetPage, pageSize });
    this.navigateTo.emit(targetPage);
  }
}
