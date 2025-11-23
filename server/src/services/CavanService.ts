import { Cavan } from '@models/Cavan';
import { User } from '@models/User';
import { NotFoundException } from '@exceptions/NotFoundException';
import { CavanRepository } from '@repositories/CavanRepository';
import { ReservationRepository } from '@repositories/ReservationRepository';
import { UserRepository } from '@repositories/UserRepository';
import { GoogleMapsService, Location } from './GoogleMapsService';

export type CavanSortBy = 'distance' | 'likes' | 'price';

// A temporary type to hold cavan data along with its calculated distance
export type CavanWithDistance = Cavan & { distance: number | null };

export class CavanService {
  constructor(
    private readonly cavanRepo: CavanRepository,
    private readonly userRepo: UserRepository,
    private readonly reservationRepo: ReservationRepository,
    private readonly googleMapsService: GoogleMapsService
  ) {}

  /**
   * Fetches and sorts all cavans based on the specified criteria.
   * @param sortBy The criteria to sort by. Defaults to 'distance'.
   * @param origin The user's location, required for distance sorting.
   * @returns A sorted list of all cavans.
   */
  async getCavans(
    sortBy: CavanSortBy = 'distance',
    origin?: Location,
  ): Promise<Cavan[]> {
    const cavans = await this.cavanRepo.findAll();

    switch (sortBy) {
      case 'price':
        // Sort by dailyRate in ascending order (cheapest first)
        return cavans.sort((a, b) => a.dailyRate - b.dailyRate);
      
      case 'likes':
        // Sort by likes in descending order (most liked first)
        return cavans.sort((a, b) => b.likes - a.likes);

      case 'distance':
        if (!origin) {
          // If no origin is provided for distance sort, return unsorted.
          // Or we could throw an error: throw new Error('Origin is required for distance sorting.');
          return cavans;
        }

        const distances = await this.googleMapsService.calculateDistances(origin, cavans);
        
        const cavansWithDistance: CavanWithDistance[] = cavans.map((cavan, index) => ({
          ...cavan,
          distance: distances[index],
        }));

        // Sort by distance in ascending order (closest first).
        // Cavans with a null distance (e.g., API error) are pushed to the end.
        return cavansWithDistance.sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });

      default:
        return cavans;
    }
  }

  async getCavanDetails(cavanId: string): Promise<{
    cavan: Cavan;
    host: User;
    transactions: number;
  }> {
    const cavan = await this.cavanRepo.findById(cavanId, 'Cavan');
    const host = await this.userRepo.findById(cavan.hostId, 'Host');

    const hostCavans = await this.cavanRepo.findByHostId(host.id);
    const hostCavanIds = hostCavans.map((c) => c.id);

    const transactions = await this.reservationRepo.countCompletedByCavanIds(
      hostCavanIds
    );

    return {
      cavan,
      host,
      transactions,
    };
  }
}
