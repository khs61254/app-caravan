import { Reservation } from '../models/Reservation';
import { ReservationRepository } from '../repositories/ReservationRepository';
import { IRepository } from '../repositories/IRepository';
import { User } from '../models/User';
import { Cavan } from '../models/Cavan';
import { ValidationException } from '../exceptions/ValidationException';
import { NotFoundException } from '../exceptions/NotFoundException';

// Using a more specific type for the request to make the service's job easier.
export type ReservationRequest = Omit<Reservation, 'id' | 'status' | 'createdAt' | 'totalPrice'>;

export class ReservationValidator {
  constructor(
    private readonly reservationRepo: ReservationRepository,
    private readonly userRepo: IRepository<User>,
    private readonly cavanRepo: IRepository<Cavan>
  ) {}

  public async validate(request: ReservationRequest): Promise<void> {
    await this.validateEntities(request.guestId, request.cavanId);
    this.validateDates(request.startDate, request.endDate);
    await this.validateNoConflicts(request.cavanId, request.startDate, request.endDate);
  }

  private validateDates(startDate: Date, endDate: Date): void {
    if (startDate >= endDate) {
      throw new ValidationException('Start date must be before end date.');
    }
    if (startDate < new Date()) {
      throw new ValidationException('Start date cannot be in the past.');
    }
    // Here you could add more rules, like minimum/maximum rental duration.
  }

  private async validateEntities(guestId: string, cavanId: string): Promise<void> {
    const guest = await this.userRepo.findById(guestId);
    if (!guest) {
      throw new NotFoundException('User', guestId);
    }

    const cavan = await this.cavanRepo.findById(cavanId);
    if (!cavan) {
      throw new NotFoundException('Cavan', cavanId);
    }
  }

  private async validateNoConflicts(cavanId: string, startDate: Date, endDate: Date): Promise<void> {
    const conflicts = await this.reservationRepo.findConflictsByCavanId(
      cavanId,
      startDate,
      endDate
    );

    if (conflicts.length > 0) {
      throw new ValidationException('The cavan is already reserved for the selected dates.');
    }
  }
}
