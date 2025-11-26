import { Reservation, ReservationStatus } from '../models/Reservation';
import { InMemoryRepository } from './InMemoryRepository';

export class ReservationRepository extends InMemoryRepository<Reservation> {
  /**
   * Finds reservations for a specific cavan that conflict with the given date range.
   * A conflict occurs if an existing reservation overlaps with the new start/end dates.
   * @param cavanId The ID of the cavan to check for conflicts.
   * @param startDate The start date of the potential new reservation.
   * @param endDate The end date of the potential new reservation.
   * @returns A list of conflicting reservations.
   */
  async findConflictsByCavanId(
    cavanId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Reservation[]> {
    const conflicts: Reservation[] = [];
    for (const reservation of this.entities.values()) {
      if (reservation.cavanId !== cavanId) {
        continue;
      }

      // Check for date range overlap.
      // A reservation is conflicting if its start time is before the new end time,
      // and its end time is after the new start time.
      const existingStart = reservation.startDate;
      const existingEnd = reservation.endDate;

      if (startDate < existingEnd && endDate > existingStart) {
        conflicts.push({ ...reservation });
      }
    }
    return conflicts;
  }

  async countCompletedByCavanIds(cavanIds: string[]): Promise<number> {
    let count = 0;
    for (const reservation of this.entities.values()) {
      if (
        cavanIds.includes(reservation.cavanId) &&
        reservation.status === 'completed'
      ) {
        count++;
      }
    }
    return count;
  }

  async countCompletedByCavanId(cavanId: string): Promise<number> {
    let count = 0;
    for (const reservation of this.entities.values()) {
      if (
        reservation.cavanId === cavanId &&
        reservation.status === 'completed'
      ) {
        count++;
      }
    }
    return count;
  }
}
