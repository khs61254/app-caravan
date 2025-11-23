export type CavanStatus = 'available' | 'reserved' | 'maintenance';

export interface Cavan {
  id: string;
  name: string;
  hostId: string; // foreign key to User
  capacity: number;
  amenities: string[];
  photos: string[]; // URLs to photos
  location: {
    lat: number;
    lng: number;
  };
  status: CavanStatus;
  dailyRate: number; // Price per day
  likes: number;
}
