import { ServiceError } from "./service-errors";

export class ResourceNotFoundError extends Error implements ServiceError {
    constructor() {
      super('Resource not found.')
    }
  }