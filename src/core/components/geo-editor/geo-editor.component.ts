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
  // Inputs (accept any GeoJSON - Geometry, Feature or FeatureCollection)
  readonly geometry = input<GeoJSON.GeoJSON | null>(null);

  // Outputs emit a Geometry (province model expects Geometry)
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
   * Validate and emit GeoJSON (accept Geometry, Feature, FeatureCollection)
   */
  protected onApply(): void {
    const text = this.geoJsonText().trim();

    if (!text) {
      this.geometryChange.emit(null);
      this.parseError.set('');
      return;
    }

    try {
      const parsed = JSON.parse(text) as GeoJSON.GeoJSON;

      // Helper to extract Geometry from various GeoJSON wrappers
      const extractGeometry = (obj: GeoJSON.GeoJSON): GeoJSON.Geometry | null => {
        // Geometry object
        if ((obj as any).type && (obj as any).coordinates) {
          return obj as GeoJSON.Geometry;
        }

        // Feature
        if ((obj as any).type === 'Feature' && (obj as any).geometry) {
          return (obj as any).geometry as GeoJSON.Geometry;
        }

        // FeatureCollection: take first feature with geometry
        if ((obj as any).type === 'FeatureCollection' && Array.isArray((obj as any).features)) {
          const featureWithGeom = (obj as any).features.find((f: any) => f && f.geometry);
          return featureWithGeom ? (featureWithGeom.geometry as GeoJSON.Geometry) : null;
        }

        return null;
      };

      const geom = extractGeometry(parsed);
      if (!geom) {
        this.parseError.set('Invalid GeoJSON: expected Geometry, Feature or FeatureCollection with at least one Feature');
        return;
      }

      this.geometryChange.emit(geom);
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
