import { User } from '../models/User';
import { InMemoryRepository } from './InMemoryRepository';

export class UserRepository extends InMemoryRepository<User> {
  // Currently, no special queries are needed, so we just use the basic CRUD functions.
  // If we need to search for users by specific criteria in the future, we can add that here.
}
