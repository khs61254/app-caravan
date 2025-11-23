import { Cavan } from "@models/Cavan";

export interface Location {
  lat: number;
  lng: number;
}

/**
 * A service to interact with the Google Maps Platform API.
 * NOTE: This service requires a valid Google Maps API key with the
 * "Distance Matrix API" enabled. The key should be stored in an
 * environment variable named GOOGLE_MAPS_API_KEY.
 */
export class GoogleMapsService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json';

  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    if (!this.apiKey) {
      console.warn(`
        **********************************************************************
        * WARNING: GOOGLE_MAPS_API_KEY is not set.                           *
        * The GoogleMapsService will return dummy data.                      *
        * For real distance calculations, please provide a valid API key.    *
        **********************************************************************
      `);
    }
  }

  /**
   * Calculates the driving distance from an origin to multiple destinations.
   * @param origin The starting point.
   * @param destinations An array of destination points (from cavans).
   * @returns A promise that resolves to an array of distances in meters.
   */
  async calculateDistances(origin: Location, cavans: Cavan[]): Promise<(number | null)[]> {
    if (!this.apiKey) {
      // Return dummy data if no API key is provided.
      // The length of the dummy array matches the number of cavans.
      console.warn('GoogleMapsService: Returning dummy distance data.');
      return cavans.map(() => Math.floor(Math.random() * 100000));
    }

    // Format destinations for the API request URL.
    const destinationsString = cavans.map(c => `${c.location.lat},${c.location.lng}`).join('|');
    const url = new URL(this.baseUrl);
    url.searchParams.append('origins', `${origin.lat},${origin.lng}`);
    url.searchParams.append('destinations', destinationsString);
    url.searchParams.append('key', this.apiKey);
    url.searchParams.append('units', 'metric'); // for meters/kilometers

    try {
      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status !== 'OK') {
        console.error('Google Maps API Error:', data.error_message || data.status);
        // Return null for all distances on API error
        return cavans.map(() => null);
      }

      // Extract the distance value for each destination.
      const distances = data.rows[0].elements.map((element: any) => {
        if (element.status === 'OK') {
          return element.distance.value; // Distance in meters
        }
        return null; // Return null if a specific route could not be found
      });

      return distances;
    } catch (error) {
      console.error('Failed to fetch from Google Maps API:', error);
      return cavans.map(() => null);
    }
  }
}
