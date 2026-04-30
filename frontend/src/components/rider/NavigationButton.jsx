import React from 'react';
import { Button } from '../ui/button';

/**
 * NavigationButton — Button to open Google Maps navigation
 * 
 * Props:
 *   - mapsUrl: string (Google Maps URL)
 *   - totalDistance: number (in km)
 */
const NavigationButton = ({ mapsUrl = '', totalDistance = 0 }) => {
  const handleNavigate = () => {
    if (mapsUrl) {
      window.open(mapsUrl, '_blank');
    }
  };

  return (
    <Button
      onClick={handleNavigate}
      disabled={!mapsUrl}
      size="lg"
      className="w-full"
    >
      <span className="flex items-center justify-center gap-2">
        <span>🗺️</span>
        <span>Start Navigation</span>
        {totalDistance > 0 && (
          <span className="text-sm">({totalDistance.toFixed(1)} km)</span>
        )}
      </span>
    </Button>
  );
};

export default NavigationButton;
