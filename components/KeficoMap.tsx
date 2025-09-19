import React, { useEffect, useState } from 'react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%',
};

interface Props {
  zoom: number;
  value?: { lat: number; lng: number };
  onDragEnd: () => void;
  onChangeMarker: (lnt: number, lng: number) => void;
  isLoaded?: boolean;
}

function KeficoMap({ zoom, value, onDragEnd, onChangeMarker, isLoaded }: Props) {
  const [center, setCenter] = useState<google.maps.LatLng | undefined>(undefined);
  const [map, setMap] = useState<google.maps.Map>();
  const [showMap, setShowMap] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMap(true);
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (value?.lat && value?.lng) {
      if (value.lat.toString().length > 9 && value.lng.toString().length > 9) {
        setCenter(value as any);
      }
    }
  }, [value]);
  return isLoaded && showMap ? (
    <GoogleMap
      onLoad={(e) => {
        setMap(e);
      }}
      zoom={zoom}
      center={value}
      mapContainerStyle={containerStyle}
      onDragEnd={onDragEnd}
      onBoundsChanged={() => {
        const center = map?.getCenter();
        if (center) {
          setCenter(center);
          onChangeMarker(center.lat(), center.lng());
        }
      }}
    >
      {center && <MarkerF position={center} />}
    </GoogleMap>
  ) : (
    <></>
  );
}

export default React.memo(KeficoMap);
