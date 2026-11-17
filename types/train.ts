export interface Station {
  code: string;
  name: string;
  lat?: number;
  lng?: number;
  scheduledArrival: string;
  scheduledDeparture: string;
  actualArrival?: string;
  actualDeparture?: string;
  delayMinutes: number;
  distanceKm: number;
  status: 'passed' | 'current' | 'upcoming';
  platform?: string;
  haltMinutes?: number;
  isHalt?: boolean; // Scheduled stoppage (true) vs skipped/intermediate station (false)
}

export interface NextHaltETA {
  stationCode: string;
  stationName: string;
  platform?: string;
  scheduledArrival: string;
  estimatedArrival: string; // Calculated time after delay
  delayMinutes: number;
  delayStatus: 'on_time' | 'delayed' | 'unavailable';
  delayText: string; // "On Time" | "Delayed by X minutes" | "ETA unavailable"
  distanceRemainingKm?: number;
}

export interface SearchResult {
  id: string;
  number: string;
  name: string;
  origin: {
    code: string;
    name: string;
  };
  destination: {
    code: string;
    name: string;
  };
  runsOn?: string[];
  duration?: string;
  departureTime?: string;
  arrivalTime?: string;
}

export interface LiveLocation {
  lat: number;
  lng: number;
  heading: number; // angle in degrees 0-360
  speedKmh: number;
  isMoving: boolean;
}

export interface LiveJourney {
  trainId: string;
  number: string;
  name: string;
  origin: {
    code: string;
    name: string;
  };
  destination: {
    code: string;
    name: string;
  };
  currentLocation: LiveLocation;
  status: 'running' | 'delayed' | 'on_time' | 'cancelled' | 'not_started' | 'completed';
  delayMinutes: number;
  speedKmh: number;
  distanceCoveredKm: number;
  remainingDistanceKm: number;
  totalDistanceKm: number;
  completionPercentage: number;
  lastUpdated: string; // ISO timestamp
  previousStation?: Station;
  currentStation?: Station;
  nextStation?: Station;
  nextHaltStation?: Station;
  ETA: string;
  nextHaltETA?: NextHaltETA;
  stations: Station[];
  routeGeometry?: [number, number][]; // Array of [lng, lat] for MapLibre polyline
}
