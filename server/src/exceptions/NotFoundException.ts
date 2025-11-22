import { ApplicationException } from './ApplicationException';

export class NotFoundException extends ApplicationException {
  constructor(resource: string, id: string) {
    super(`${resource} with ID '${id}' not found.`, 404); // Not Found
  }
}
