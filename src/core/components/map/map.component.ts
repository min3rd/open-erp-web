import {
  ChangeDetectionStrategy,
  Component,
  input,
  effect,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import * as L from 'leaflet';

/**
 * Shared Map Component using Leaflet
 * Displays an OpenStreetMap base layer and optional GeoJSON layers
 */
@Component({
  selector: 'core-map',
  imports: [],
  templateUrl: './map.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  // Input signals
  readonly geometry = input<GeoJSON.Geometry | null>(null);
  readonly center = input<[number, number]>([15.9749, 108.2515]); // Vietnam center
  readonly zoom = input<number>(6);
  readonly showLabels = input<boolean>(true);

  private map: L.Map | null = null;
  private geoJsonLayer: L.GeoJSON | null = null;

  constructor() {
    // React to geometry changes
    effect(() => {
      const geom = this.geometry();
      if (this.map) {
        this.updateGeoJSON(geom);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  /**
   * Initialize the Leaflet map
   */
  private initMap(): void {
    // Create map instance
    this.map = L.map('core-map-container').setView(this.center(), this.zoom());

    // Add OpenStreetMap tile layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    // Add initial geometry if provided
    const initialGeom = this.geometry();
    if (initialGeom) {
      this.updateGeoJSON(initialGeom);
    }
  }

  /**
   * Update the GeoJSON layer on the map
   */
  private updateGeoJSON(geometry: GeoJSON.Geometry | null): void {
    if (!this.map) return;

    // Remove existing layer
    if (this.geoJsonLayer) {
      this.map.removeLayer(this.geoJsonLayer);
      this.geoJsonLayer = null;
    }

    // Add new layer if geometry exists
    if (geometry) {
      this.geoJsonLayer = L.geoJSON(geometry, {
        style: {
          color: '#3b82f6',
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.3,
        },
      }).addTo(this.map);

      // Fit map to geometry bounds
      const bounds = this.geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        this.map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }

  /**
   * Public method to update map center
   */
  public setCenter(center: [number, number], zoom?: number): void {
    if (this.map) {
      this.map.setView(center, zoom || this.map.getZoom());
    }
  }

  /**
   * Public method to fit bounds
   */
  public fitBounds(bounds: L.LatLngBoundsExpression): void {
    if (this.map) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }
}
