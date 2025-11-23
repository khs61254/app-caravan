export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Reservation {
  id: string;
  guestId: string; // foreign key to User
  cavanId: string; // foreign key to Cavan
  startDate: Date;
  endDate: Date;
  status: ReservationStatus;
  totalPrice: number;
  createdAt: Date;
}
