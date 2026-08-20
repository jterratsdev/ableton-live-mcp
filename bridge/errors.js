export class BridgeRequestError extends Error {
  constructor(message, statusCode = 400, details = {}) {
    super(message);
    this.name = "BridgeRequestError";
    this.statusCode = statusCode;
    this.details = details;
  }
}
