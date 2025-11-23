import { Reservation } from '@models/Reservation';
import { Cavan } from '@models/Cavan';
import { IRepository } from '@repositories/IRepository';
import { ReservationRepository } from '@repositories/ReservationRepository';
import { ReservationValidator, ReservationRequest } from '@validators/ReservationValidator';
import { NotFoundException } from '@exceptions/NotFoundException';

export class ReservationService {
  constructor(
    private readonly reservationRepo: ReservationRepository,
    private readonly cavanRepo: IRepository<Cavan>,
    private readonly reservationValidator: ReservationValidator,
  ) {}

  /**
   * Creates a new reservation after validating the request and calculating the price.
   * @param request The data for the new reservation.
   * @returns The newly created Reservation object.
   */
  async createReservation(request: ReservationRequest): Promise<Reservation> {
    // 1. Validate the request
    await this.reservationValidator.validate(request);

    // 2. Calculate the price
    const cavan = await this.cavanRepo.findById(request.cavanId);
    if (!cavan) {
      // This check is redundant due to the validator, but it satisfies the compiler
      // and adds a layer of defense.
      throw new NotFoundException('Cavan', request.cavanId);
    }
    const totalPrice = this.calculatePrice(request.startDate, request.endDate, cavan.dailyRate);

    // 3. Create the Reservation object (acting as a factory)
    const newReservation: Omit<Reservation, 'id'> = {
      ...request,
      totalPrice,
      status: 'pending', // Initial status
      createdAt: new Date(),
    };

    // 4. Save the reservation
    const savedReservation = await this.reservationRepo.save(newReservation);
    
    // 5. In a future implementation, this is where you might trigger a payment process
    // or emit an event for notifications (Observer Pattern).
    
    return savedReservation;
  }

  /**
   * Calculates the total price for a reservation based on the duration and daily rate.
   */
  private calculatePrice(startDate: Date, endDate: Date, dailyRate: number): number {
    const durationInMs = endDate.getTime() - startDate.getTime();
    // Convert ms to days, rounding up to the nearest full day.
    const durationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24));
    
    if (durationInDays <= 0) {
      return dailyRate; // Minimum 1 day rental
    }
    
    return durationInDays * dailyRate;
  }
}
