export interface Review {
  id: string;
  reservationId: string; // The context of the review
  authorId: string; // The user who wrote the review
  subjectId: string; // The user or caravan being reviewed
  rating: number; // e.g., 1-5
  comment: string;
  createdAt: Date;
}
