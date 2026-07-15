import React from 'react';
import { Map, Marker } from '@vis.gl/react-google-maps';

function MapView({ defaultPosition, onMapClick, pointA, pointB, pointC }) {
  return (
    <div 
      className="map-view" 
      style={{ 
        flex: 1, 
        height: '100vh',     /* পুরো স্ক্রিনের সমান হাইট */
        width: '100%',       /* বাকি পুরো উইডথ */
        position: 'relative' 
      }}
    >
      <Map
        style={{ width: '100%', height: '100%' }} /* ম্যাপ কম্পোনেন্টকেও ফুল সাইজ দেওয়া হলো */
        defaultZoom={12}
        defaultCenter={defaultPosition}
        onClick={onMapClick}
        gestureHandling={'greedy'}
        disableDefaultUI={false}
      >
        {pointA && <Marker position={pointA} label="A" />}
        {pointB && <Marker position={pointB} label="B" />}
        {pointC && <Marker position={pointC} label="C" />}
      </Map>
    </div>
  );
}

export default MapView;