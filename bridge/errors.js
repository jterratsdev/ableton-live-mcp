export class BridgeRequestError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "BridgeRequestError";
    this.statusCode = statusCode;
  }
}
