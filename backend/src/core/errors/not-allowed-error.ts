import { ServiceError } from "./service-errors";

export class NotAllowedError extends Error implements ServiceError {
    constructor() {
      super('Not allowed.')
    }
  }