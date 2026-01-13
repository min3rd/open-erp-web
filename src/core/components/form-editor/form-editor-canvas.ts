import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';
import { FormComponent, LayoutComponentConfig, FormFieldConfig } from './form-editor.types';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Select } from 'primeng/select';
import { Checkbox } from 'primeng/checkbox';
import { RadioButton } from 'primeng/radiobutton';
import { DatePicker } from 'primeng/datepicker';
import { Button } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { AutoComplete } from 'primeng/autocomplete';
import { ColorPicker } from 'primeng/colorpicker';
import { Rating } from 'primeng/rating';
import { Slider } from 'primeng/slider';
import { SelectButton } from 'primeng/selectbutton';
import { ToggleButton } from 'primeng/togglebutton';
import { ToggleSwitch } from 'primeng/toggleswitch';

@Component({
  selector: 'form-editor-canvas',
  imports: [
    CommonModule,
    TranslocoModule,
    InputText,
    Textarea,
    Select,
    Checkbox,
    RadioButton,
    DatePicker,
    Button,
    Divider,
    AutoComplete,
    ColorPicker,
    Rating,
    Slider,
    SelectButton,
    ToggleButton,
    ToggleSwitch,
  ],
  template: `
    <div
      id="form-editor-canvas"
      class="h-full bg-white dark:bg-surface-800 overflow-y-auto"
      (dragover)="onDragOver($event)"
      (drop)="onDrop($event, null)"
    >
      <div class="p-6">
        @if (components().length === 0) {
          <div class="text-center py-12">
            <i class="pi pi-plus-circle text-6xl text-surface-300 mb-4" aria-hidden="true"></i>
            <p class="text-surface-500">
              {{ 'formEditor.messages.emptyCanvas' | transloco }}
            </p>
          </div>
        } @else {
          <div class="space-y-4">
            @for (component of components(); track component.id) {
              <div
                [id]="'form-editor-canvas-' + component.id"
                class="relative"
                [class.ring-2]="component.id === selectedComponentId()"
                [class.ring-primary]="component.id === selectedComponentId()"
                (click)="onComponentClick($event, component)"
              >
                @if (isLayoutComponent(component)) {
                  <div [ngClass]="component.cssClasses || ''">
                    @if (component.type === 'divider') {
                      <p-divider />
                    } @else if (component.type === 'button') {
                      <p-button
                        [label]="component.label || component.labelKey || 'Button'"
                        [disabled]="component.disabled"
                      />
                    } @else {
                      <!-- Layout container -->
                      <div
                        class="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded p-4 min-h-[100px]"
                        (dragover)="onDragOver($event)"
                        (drop)="onDrop($event, component.id)"
                      >
                        @if (getLayoutChildren(component).length > 0) {
                          <div class="space-y-3">
                            @for (child of getLayoutChildren(component); track child.id) {
                              <div
                                [id]="'form-editor-canvas-' + child.id"
                                [class.ring-2]="child.id === selectedComponentId()"
                                [class.ring-primary]="child.id === selectedComponentId()"
                                (click)="onComponentClick($event, child)"
                              >
                                <ng-container
                                  *ngTemplateOutlet="
                                    fieldTemplate;
                                    context: { $implicit: child }
                                  "
                                />
                              </div>
                            }
                          </div>
                        } @else {
                          <p class="text-sm text-surface-400 text-center">
                            Drop components here
                          </p>
                        }
                      </div>
                    }
                  </div>
                } @else {
                  <ng-container
                    *ngTemplateOutlet="fieldTemplate; context: { $implicit: component }"
                  />
                }
              </div>
            }
          </div>
        }
      </div>
    </div>

    <ng-template #fieldTemplate let-component>
      <div class="space-y-2">
        @if (component.label || component.labelKey) {
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300">
            {{ component.label || (component.labelKey | transloco) }}
            @if (component.required) {
              <span class="text-red-600">*</span>
            }
          </label>
        }

        @switch (component.type) {
          @case ('input') {
            <input
              pInputText
              type="text"
              [placeholder]="component.placeholder || (component.placeholderKey | transloco)"
              [disabled]="component.disabled"
              [required]="component.required"
              class="w-full"
              readonly
            />
          }
          @case ('textarea') {
            <textarea
              pTextarea
              [placeholder]="component.placeholder || (component.placeholderKey | transloco)"
              [disabled]="component.disabled"
              [required]="component.required"
              class="w-full"
              rows="3"
              readonly
            ></textarea>
          }
          @case ('select') {
            <p-select
              [placeholder]="component.placeholder || (component.placeholderKey | transloco)"
              [disabled]="component.disabled"
              [options]="component.options || []"
              optionLabel="label"
              optionValue="value"
              class="w-full"
              [showClear]="true"
            />
          }
          @case ('checkbox') {
            <div class="flex items-center gap-2">
              <p-checkbox [disabled]="component.disabled" [binary]="true" />
            </div>
          }
          @case ('radio-button') {
            <div class="flex flex-col gap-2">
              @for (option of component.options || []; track option.value) {
                <div class="flex items-center gap-2">
                  <p-radiobutton
                    [name]="component.id"
                    [value]="option.value"
                    [disabled]="component.disabled"
                  />
                  <label class="text-sm">{{ option.label }}</label>
                </div>
              }
            </div>
          }
          @case ('date-picker') {
            <p-datepicker
              [placeholder]="component.placeholder || (component.placeholderKey | transloco)"
              [disabled]="component.disabled"
              [showIcon]="true"
              class="w-full"
            />
          }
          @case ('autocomplete') {
            <p-autocomplete
              [placeholder]="component.placeholder || (component.placeholderKey | transloco)"
              [disabled]="component.disabled"
              [suggestions]="component.options || []"
              field="label"
              class="w-full"
            />
          }
          @case ('color-picker') {
            <p-colorpicker [disabled]="component.disabled" />
          }
          @case ('rating') {
            <p-rating [disabled]="component.disabled" />
          }
          @case ('slider') {
            <p-slider [disabled]="component.disabled" class="w-full" />
          }
          @case ('select-button') {
            <p-selectbutton
              [options]="component.options || []"
              optionLabel="label"
              optionValue="value"
              [disabled]="component.disabled"
            />
          }
          @case ('toggle-button') {
            <p-togglebutton
              [onLabel]="component.label || 'On'"
              [offLabel]="component.label || 'Off'"
              [disabled]="component.disabled"
            />
          }
          @case ('toggle-switch') {
            <p-toggleswitch [disabled]="component.disabled" />
          }
        }
      </div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormEditorCanvas {
  components = input<FormComponent[]>([]);
  selectedComponentId = input<string | null>(null);

  componentSelected = output<FormComponent>();
  componentDropped = output<{ componentType: string; parentId: string | null }>();

  isLayoutComponent(component: FormComponent): boolean {
    return [
      'layout-1-column',
      'layout-2-column',
      'layout-3-column',
      'divider',
      'button',
    ].includes(component.type);
  }

  getLayoutChildren(component: FormComponent): FormComponent[] {
    if (this.isLayoutComponent(component)) {
      const layoutComp = component as LayoutComponentConfig;
      return layoutComp.children || [];
    }
    return [];
  }

  onComponentClick(event: MouseEvent, component: FormComponent): void {
    event.stopPropagation();
    this.componentSelected.emit(component);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  onDrop(event: DragEvent, parentId: string | null): void {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer) {
      const data = event.dataTransfer.getData('application/json');
      if (data) {
        try {
          const component = JSON.parse(data);
          this.componentDropped.emit({
            componentType: component.type,
            parentId,
          });
        } catch (e) {
          console.error('Failed to parse dropped component:', e);
        }
      }
    }
  }
}
