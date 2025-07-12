import { ServiceError } from "./service-errors";

export class ResourceNotFoundError extends Error implements ServiceError {
    constructor(message?: string) {
      super(message || 'Resource not found.')
    }
  }