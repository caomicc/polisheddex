'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapViewerInner() {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current) return;

    const IMAGE_WIDTH = 14016;
    const IMAGE_HEIGHT = 6258;
    const TILE_SIZE = 256;
    const MAX_ZOOM = 6; // because your google-layout tiles go 0–6

    // Create map
    mapRef.current = L.map('map', {
      crs: L.CRS.Simple,
      minZoom: 0,
      maxZoom: MAX_ZOOM,
      zoom: 0,
    });

    // Convert pixel bounds to LatLng at max zoom
    const southWest = mapRef.current.unproject([0, IMAGE_HEIGHT], MAX_ZOOM);
    const northEast = mapRef.current.unproject([IMAGE_WIDTH, 0], MAX_ZOOM);
    const bounds = new L.LatLngBounds(southWest, northEast);

    // Add tiles
    L.tileLayer('/tiles/{z}/{y}/{x}.webp', {
      tileSize: TILE_SIZE,
      minZoom: 0,
      maxZoom: MAX_ZOOM,
      noWrap: true,
      bounds: bounds,
    }).addTo(mapRef.current);

    // Fit and lock to image bounds
    mapRef.current.fitBounds(bounds);
    mapRef.current.setMaxBounds(bounds);
  }, []);

  return <div id="map" className="h-[600px] max-w-4xl rounded-lg container mx-auto" />;
}
