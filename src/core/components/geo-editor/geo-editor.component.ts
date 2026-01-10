import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
  effect,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoModule } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';

/**
 * GeoEditor Component
 * Allows users to paste GeoJSON geometry or edit it as text
 */
@Component({
  selector: 'core-geo-editor',
  imports: [FormsModule, TranslocoModule, ButtonModule, TextareaModule],
  templateUrl: './geo-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoEditorComponent {
  // Inputs
  readonly geometry = input<GeoJSON.Geometry | null>(null);

  // Outputs
  readonly geometryChange = output<GeoJSON.Geometry | null>();

  // State
  protected readonly geoJsonText = signal<string>('');
  protected readonly parseError = signal<string>('');

  constructor() {
    // Sync geometry input to text
    effect(() => {
      const geom = this.geometry();
      if (geom) {
        this.geoJsonText.set(JSON.stringify(geom, null, 2));
      } else {
        this.geoJsonText.set('');
      }
    });
  }

  /**
   * Handle text change
   */
  protected onTextChange(value: string): void {
    this.geoJsonText.set(value);
    this.parseError.set('');
  }

  /**
   * Validate and emit GeoJSON
   */
  protected onApply(): void {
    const text = this.geoJsonText().trim();

    if (!text) {
      this.geometryChange.emit(null);
      this.parseError.set('');
      return;
    }

    try {
      const parsed = JSON.parse(text);

      // Basic validation: check if it looks like a GeoJSON geometry
      if (!parsed.type || !parsed.coordinates) {
        this.parseError.set('Invalid GeoJSON: missing type or coordinates');
        return;
      }

      this.geometryChange.emit(parsed as GeoJSON.Geometry);
      this.parseError.set('');
    } catch (error) {
      this.parseError.set('Invalid JSON: ' + (error as Error).message);
    }
  }

  /**
   * Clear geometry
   */
  protected onClear(): void {
    this.geoJsonText.set('');
    this.parseError.set('');
    this.geometryChange.emit(null);
  }
}
