export class ApplicationException extends Error {
  constructor(public readonly message: string, public readonly status: number = 500) {
    super(message);
    this.name = this.constructor.name;
  }
}
