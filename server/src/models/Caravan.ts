export type CaravanStatus = 'available' | 'reserved' | 'maintenance';

export interface Caravan {
  id: string;
  hostId: string; // foreign key to User
  capacity: number;
  amenities: string[];
  photos: string[]; // URLs to photos
  location: string;
  status: CaravanStatus;
  dailyRate: number; // Added from "가격" section
}
