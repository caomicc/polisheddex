import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapViewerInner() {
  const mapRef = useRef<L.Map | null>(null);
  useEffect(() => {
    if (mapRef.current) return; // already initialized

    const tileSize = 256;
    const maxZoom = 5;

    const maxTilesX = 55;
    const maxTilesY = 25;

    const mapWidth = maxTilesX * tileSize;
    const mapHeight = maxTilesY * tileSize;

    const southWest = L.point(0, mapHeight);
    const northEast = L.point(mapWidth, 0);

    console.log('MapViewerInner useEffect triggered', southWest, northEast);

    const southWestLatLng = L.CRS.Simple.pointToLatLng(southWest, 0);
    const northEastLatLng = L.CRS.Simple.pointToLatLng(northEast, 0);

    const maxBounds = L.latLngBounds(southWestLatLng, northEastLatLng);

    console.log('Initializing map with bounds:', maxBounds);
    console.log('Map width:', mapWidth, 'Map height:', mapHeight);

    const mySimpleCRS = L.extend({}, L.CRS.Simple, {
      //                      coefficients: a      b    c     d
      transformation: new L.Transformation(1 / 64, 0, 1 / 64, 0),
    });

    mapRef.current = L.map('map', {
      crs: mySimpleCRS,
      minZoom: 0,
      maxZoom,
      maxBounds,
      maxBoundsViscosity: 1.0,
      center: [mapHeight / 2, mapWidth / 2],
      zoom: 0,
    });

    // Create tile layer WITHOUT getTileUrl in options
    const tileLayer = L.tileLayer('/tiles/{z}/{x}/{y}.webp', {
      tileSize,
      noWrap: true,
      bounds: maxBounds,
    });

    console.log('Tile layer created with bounds:', maxBounds, tileLayer);

    // Override getTileUrl method directly
    tileLayer.getTileUrl = function (coords) {
      console.log('getTileUrl called for coords:', coords);
      const { x, y, z } = coords;

      // For debugging - let's see what's being requested
      console.log(`Requesting tile at zoom ${z}: (${x}, ${y})`);

      // Set maxTilesAtZoomX and maxTilesAtZoomY manually per zoom level
      // These should be the actual max index (not count), so subtract 1 from file count
      const zoomTileCounts = [
        { x: 0, y: 0 }, // zoom 0: 1 tile (0.webp)
        { x: 0, y: 1 }, // zoom 1: 2 tiles (0.webp, 1.webp)
        { x: 1, y: 3 }, // zoom 2
        { x: 3, y: 6 }, // zoom 3
        { x: 6, y: 13 }, // zoom 4
        { x: 12, y: 27 }, // zoom 5
        { x: 24, y: 54 }, // zoom 6
      ];
      const maxTilesAtZoomX = zoomTileCounts[z]?.x ?? maxTilesX;
      const maxTilesAtZoomY = zoomTileCounts[z]?.y ?? maxTilesY;

      console.log(`Max tiles at zoom ${z}: ${maxTilesAtZoomX}x${maxTilesAtZoomY}`);

      // Handle coordinate transformation for vips tile layout
      // At zoom 1: Leaflet expects (0,-1) and (1,-1), but we have tiles at 0/0.webp and 0/1.webp
      let adjustedX = x;
      let adjustedY = y < 0 ? Math.abs(y) - 1 : y;

      // Special handling for zoom level 1: map requests to actual tile structure
      if (z === 1) {
        if (x === 0 && y === -1) {
          // First tile: /tiles/1/0/0.webp
          adjustedX = 0;
          adjustedY = 0;
        } else if (x === 1 && y === -1) {
          // Second tile: /tiles/1/0/1.webp
          adjustedX = 0;
          adjustedY = 1;
        } else if (x === 0 && y === -2) {
          // Alternative mapping
          adjustedX = 0;
          adjustedY = 1;
        }
      }

      console.log(`Adjusted coordinates: (${adjustedX}, ${adjustedY})`);

      // Check bounds with adjusted coordinates
      if (
        adjustedX < 0 ||
        adjustedY < 0 ||
        adjustedX > maxTilesAtZoomX ||
        adjustedY > maxTilesAtZoomY
      ) {
        console.warn(`Tile request out of bounds: (${adjustedX}, ${adjustedY}) at zoom ${z}`);
        return '/tiles/blank.png'; // return blank tile for out of bounds
      }

      // Use the adjusted coordinates
      const tileUrl = `/tiles/${z}/${adjustedX}/${adjustedY}.webp`;
      console.log(`Returning tile URL: ${tileUrl}`);

      return tileUrl;
    };

    tileLayer.addTo(mapRef.current);

    console.log('Map layer added to map:', tileLayer);

    mapRef.current.fitBounds(maxBounds);
  }, []);

  return <div id="map" style={{ width: '100%', height: '100vh' }} />;
}
