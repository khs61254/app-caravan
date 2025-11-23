import { User } from '../models/User';
import { InMemoryRepository } from './InMemoryRepository';

export class UserRepository extends InMemoryRepository<User> {
  public findByEmail(email: string): User | undefined {
    for (const user of this.entities.values()) {
      if (user.email === email) {
        return { ...user };
      }
    }
    return undefined;
  }
}
