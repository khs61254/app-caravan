import { Cavan } from '@models/Cavan';
import { User } from '@models/User';
import { NotFoundException } from '@exceptions/NotFoundException';
import { CavanRepository } from '@repositories/CavanRepository';
import { ReservationRepository } from '@repositories/ReservationRepository';
import { UserRepository } from '@repositories/UserRepository';
import { GoogleMapsService, Location } from './GoogleMapsService';

export type CavanSortBy = 'distance' | 'likes' | 'price';

// A temporary type to hold cavan data along with its calculated distance and transaction count
export type CavanWithDetails = Cavan & { distance: number | null, transactionCount: number };


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
  ): Promise<CavanWithDetails[]> {
    const cavans = await this.cavanRepo.findAll();

    let enrichedCavans: CavanWithDetails[];

    // Always enrich cavans with distance (if origin provided) and transaction count
    enrichedCavans = await Promise.all(
      cavans.map(async (cavan) => {
        let distance: number | null = null;
        if (origin) {
          const distances = await this.googleMapsService.calculateDistances(origin, [cavan]);
          distance = distances[0];
        }
        const transactionCount = await this.reservationRepo.countCompletedByCavanId(cavan.id);
        
        return {
          ...cavan,
          distance,
          transactionCount,
        };
      })
    );
    
    // Now, sort the enriched cavan objects based on sortBy
    switch (sortBy) {
      case 'price':
        return enrichedCavans.sort((a, b) => a.dailyRate - b.dailyRate);
      
      case 'likes':
        return enrichedCavans.sort((a, b) => b.likedBy.length - a.likedBy.length);

      case 'distance':
        if (!origin) {
          return enrichedCavans; // Return unsorted if no origin for distance sort
        }
        return enrichedCavans.sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });

      default:
        return enrichedCavans; // Default to returning enrichedCavans (e.g., if sortBy is undefined or distance without origin)
    }
  }

  async getCavanDetails(cavanId: string): Promise<{
    cavan: Cavan;
    host: User;
    transactions: number;
  }> {
    console.log(`[CavanService] getCavanDetails called for cavanId: ${cavanId}`);
    const cavan = await this.cavanRepo.findById(cavanId, 'Cavan');
    console.log(`[CavanService] Found cavan: ${cavan ? cavan.id : 'null'}`);
    const host = await this.userRepo.findById(cavan.hostId, 'Host');
    console.log(`[CavanService] Found host: ${host ? host.id : 'null'}`);

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

  async createCavan(cavanData: {
    name: string;
    dailyRate: number;
    location: { lat: number; lng: number };
    hostId: string;
    capacity: number;
    amenities: string[];
    photos: string[];
  }): Promise<Cavan> {
    const newCavan: Omit<Cavan, 'id'> = {
      ...cavanData,
      status: 'available',
      likedBy: [],
    };
    return this.cavanRepo.save(newCavan);
  }

  async toggleLike(cavanId: string, userId: string): Promise<Cavan> {
    const cavan = await this.cavanRepo.findById(cavanId, 'Cavan');
    const userIndex = cavan.likedBy.indexOf(userId);

    if (userIndex > -1) {
      // User has already liked the cavan, so unlike it
      cavan.likedBy.splice(userIndex, 1);
    } else {
      // User has not liked the cavan, so like it
      cavan.likedBy.push(userId);
    }

    return this.cavanRepo.save(cavan);
  }

  async getLikedCavans(userId: string): Promise<Cavan[]> {
    return this.cavanRepo.findLikedBy(userId);
  }

  async getRegisteredCavans(userId: string): Promise<Cavan[]> {
    return this.cavanRepo.findByHostId(userId);
  }

  async deleteCavan(cavanId: string, userId: string): Promise<boolean> {
    const cavan = await this.cavanRepo.findById(cavanId, 'Cavan');

    if (cavan.hostId !== userId) {
      // In a real application, you might use a more specific error type,
      // e.g., ForbiddenException
      throw new Error('User is not authorized to delete this cavan');
    }

    return this.cavanRepo.delete(cavanId);
  }
}
