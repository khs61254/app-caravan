export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  reservationId: string; // foreign key to Reservation
  amount: number;
  status: PaymentStatus;
  createdAt: Date;
  // In a real system, you'd have more details like payment method, transaction ID, etc.
  transactionId?: string;
}
