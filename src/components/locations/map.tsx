'use client';

import dynamic from 'next/dynamic';

const MapViewer = dynamic(() => import('./map-viewer-inner'), {
  ssr: false,
});

export default MapViewer;
