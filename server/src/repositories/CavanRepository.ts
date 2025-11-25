import { Cavan } from '../models/Cavan';
import { InMemoryRepository } from './InMemoryRepository';

export class CavanRepository extends InMemoryRepository<Cavan> {
  async findByHostId(hostId: string): Promise<Cavan[]> {
    const cavans: Cavan[] = [];
    for (const cavan of this.entities.values()) {
      if (cavan.hostId === hostId) {
        cavans.push({ ...cavan });
      }
    }
    return cavans;
  }

  async findLikedBy(userId: string): Promise<Cavan[]> {
    const cavans: Cavan[] = [];
    for (const cavan of this.entities.values()) {
      if (cavan.likedBy.includes(userId)) {
        cavans.push({ ...cavan });
      }
    }
    return cavans;
  }
}
