import React from 'react';
import { Map, Marker } from '@vis.gl/react-google-maps';

function MapView({ defaultPosition, pointB, pointC }) {
  return (
    <div className="map-view" style={{ flex: 1, height: '100vh', width: '100%' }}>
      <Map
        style={{ width: '100%', height: '100%' }}
        defaultZoom={12}
        defaultCenter={defaultPosition}
        gestureHandling={'greedy'}
      >
        {/* কাস্টমারের পিকআপ পয়েন্ট */}
        {pointB && <Marker position={pointB} label="📍 B" />}
        
        {/* কাস্টমারের গন্তব্য বা ড্রপঅফ পয়েন্ট */}
        {pointC && <Marker position={pointC} label="🏁 C" />}
      </Map>
    </div>
  );
}

export default MapView;