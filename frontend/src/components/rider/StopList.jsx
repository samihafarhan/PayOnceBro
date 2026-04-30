import React from 'react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { Skeleton } from '../ui/skeleton';

/**
 * StopList — Displays ordered stops for route optimization
 * 
 * Props:
 *   - stops: [{ id, name, type, lat, lng, distanceFromPrev }, ...]
 *   - totalDistance: number (in km)
 *   - isLoading: boolean
 */
const StopList = ({ stops = [], totalDistance = 0, isLoading = false }) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-16 rounded-md" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (stops.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No stops found for this route
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Pickup Route</CardTitle>
        <p className="text-sm text-muted-foreground">
          Total Distance: <span className="font-bold text-foreground">{totalDistance.toFixed(2)} km</span>
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
        {stops.map((stop, index) => {
          const isRestaurant = stop.type === 'restaurant';
          const isCustomer = stop.type === 'customer';
          
          return (
            <div key={stop.id} className="flex items-start gap-4">
              {/* Stop number circle */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full font-semibold text-white text-sm flex items-center justify-center ${isCustomer ? 'bg-green-500' : 'bg-blue-500'}`}>
                {index + 1}
              </div>

              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {stop.name}
                </p>
                <div className="mt-1">
                  <Badge variant={isCustomer ? 'secondary' : 'outline'}>
                    {isRestaurant && 'Restaurant'}
                    {isCustomer && 'Customer Delivery'}
                  </Badge>
                </div>
                {index < stops.length - 1 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Distance to next: <span className="font-semibold">{stop.distanceFromPrev?.toFixed(2) || 0} km</span>
                  </p>
                )}
              </div>

              {/* Visual line between stops */}
              {index < stops.length - 1 && (
                <div className="w-0.5 h-12 bg-gray-200 ml-2 -mr-4" />
              )}
            </div>
          );
        })}
        </div>

      {/* Route summary */}
      <Separator className="my-6" />
      <div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Restaurants</p>
            <p className="text-lg font-bold text-foreground">
              {stops.filter(s => s.type === 'restaurant').length}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Distance</p>
            <p className="text-lg font-bold text-foreground">
              {totalDistance.toFixed(2)} km
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Est. Time</p>
            <p className="text-lg font-bold text-foreground">
              {Math.ceil((totalDistance / 30) * 60)} min
            </p>
          </div>
        </div>
      </div>
      </CardContent>
    </Card>
  );
};

export default StopList;
