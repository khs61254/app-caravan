export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Reservation {
  id: string;
  guestId: string; // foreign key to User
  caravanId: string; // foreign key to Caravan
  startDate: Date;
  endDate: Date;
  status: ReservationStatus;
  totalPrice: number;
  createdAt: Date;
}
