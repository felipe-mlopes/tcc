import { ServiceError } from "./service-errors";

export class WrongCredentialsError extends Error implements ServiceError {
    constructor(message?: string) {
      super(message || 'Credentials are not valid.')
    }
  }