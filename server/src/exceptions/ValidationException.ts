import { ApplicationException } from './ApplicationException';

export class ValidationException extends ApplicationException {
  constructor(message: string) {
    super(message, 400); // Bad Request
  }
}
