import { ServiceError } from "./service-errors";

export class NotAllowedError extends Error implements ServiceError {
    constructor(message?: string) {
      super(message || 'Not allowed.')
    }
  }